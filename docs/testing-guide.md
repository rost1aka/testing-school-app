# Testing guide

This project has four levels of automated tests: unit tests and API
integration tests, both run under Jest; component tests, run under Vitest;
and browser tests, run under Playwright. This guide covers what each is
for, the exact commands to run them, how to read a validation failure, and
how to recognise a test that passes without actually proving anything.

## The four levels

### Unit tests

Unit tests exercise pure logic with no I/O: no network, no database, no
filesystem. They live next to the code they test, as `src/**/*.spec.ts`
inside `apps/api`, and as `src/**/*.spec.ts` inside `packages/shared`.
Reach for a unit test when the thing you're checking is a function of its
inputs — a validation schema, a password hash, a token expiry calculation,
an error-formatting helper.

Run the whole unit suite for the API:

```bash
pnpm --filter @school/api test
```

Run the shared package's unit suite:

```bash
pnpm --filter @school/shared test
```

### API integration tests

API integration tests exercise anything that crosses HTTP or touches the
database: a controller wired to a real NestJS application instance, real
Postgres, a real `supertest` request. They live in `apps/api/test/` as
`*.e2e-spec.ts`. Reach for one of these when the behaviour you're checking
only exists once the pieces are wired together — a route returning the
right status code, a cookie being set, a row actually persisting, one
user being unable to reach another user's data.

Run the whole API integration suite:

```bash
pnpm --filter @school/api test:e2e
```

This suite talks to a real Postgres database — the one `docker compose up`
starts, at the address in `TEST_DATABASE_URL` — and applies migrations
against it before the first test runs. It also runs with `--runInBand`: the
tests share one database, so they run one at a time rather than in
parallel.

Some flows send email — the password-reset flow, for instance. In
development and in the integration suite, outgoing mail is sent to
[Maildev](https://github.com/maildev/maildev) rather than a real inbox.
Maildev's SMTP listener is what `SMTP_HOST` / `SMTP_PORT` point at, and its
web UI, where you can read the mail a test or a manual run just sent, is at
http://localhost:1080.

### Running a single file

Both `test` and `test:e2e` are thin wrappers around Jest, so a pattern
after `--` is passed straight through to Jest and matched against test
file paths:

```bash
pnpm --filter @school/api test -- crypto.util.spec.ts
pnpm --filter @school/api test:e2e -- auth-login.e2e-spec.ts
```

### Reading a `fieldErrors` response

Every error response from the API has the same shape:

```json
{ "code": "VALIDATION_FAILED", "message": "Check the highlighted fields", "fieldErrors": { "email": ["Invalid email"] } }
```

`code` is a stable machine-readable string, `message` is safe to show a
person, and `fieldErrors` is `null` for every error except a validation
failure. When it isn't `null`, it's an object keyed by field name (dotted
path for nested fields), where each value is an array of the messages that
field failed. A test asserting on a validation failure should assert on
the specific key and message in `fieldErrors`, not just on the status code
— the status code alone doesn't tell you which field, or why.

### Component tests

Component tests exercise a single React component in isolation: rendering,
user interaction, and how per-field errors are displayed — with no server
behind it. They live in `apps/web/tests/` as `*.test.tsx` and run under
Vitest with Testing Library. Reach for a component test when the thing
you're checking is how a piece of UI renders or responds to interaction —
a field showing its error message, a button disabling itself while a
submission is in flight, a form clearing after a successful save. Query
elements the way a user or assistive technology would: by label and by
role, not by test id — a query that only passes because of a `data-testid`
attribute doesn't tell you whether the markup is actually usable.

Run the whole component suite:

```bash
pnpm --filter @school/web test
```

### Browser tests

Browser tests drive a real browser against the running application. They
live in `e2e/` as `*.spec.ts` and run under Playwright. Reach for a
browser test when the behaviour you're checking only exists once a real
browser is involved — a flow that spans more than one page, a redirect
back to the page that required sign-in, a cookie surviving navigation.
Assertions should be web-first — `expect(locator).toBeVisible()`,
`expect(page).toHaveURL(...)` and similar, which retry until they pass or
time out — rather than a fixed `sleep`, which either wastes time waiting
for something that already happened or races something that hasn't.

The browser suite needs both servers running in separate terminals before
you run it:

```bash
pnpm dev
```

```bash
pnpm --filter @school/web dev
```

Then run the suite:

```bash
pnpm --filter @school/e2e test
```

## Tests that pass without proving anything

A test suite that's green tells you nothing by itself. The question that
matters is: if the code under test were wrong, would this test fail? A
test that would still pass against broken code is worse than no test,
because it looks like coverage without providing any. Two patterns produce
this reliably.

### Asserting on the mock instead of the result

```ts
// Proves only that the function was called — not that it did the right thing.
it("charges the customer", async () => {
  const charge = jest.spyOn(paymentGateway, "charge");
  await checkout(cart);
  expect(charge).toHaveBeenCalled();
});
```

`charge` could throw away its arguments, charge the wrong amount, or charge
the wrong customer, and this test would still pass — it only checks that
the function was invoked, never what it did or what came back. Assert on
the observable outcome instead: the arguments the dependency was actually
called with, or, better, the effect of the call.

```ts
it("charges the customer the cart total", async () => {
  const charge = jest.spyOn(paymentGateway, "charge");
  await checkout(cart);
  expect(charge).toHaveBeenCalledWith(cart.customerId, cart.total);
});
```

### Computing the expected value with the same helper the code under test uses

```ts
// expected and actual are computed the same way, so a bug in
// applyDiscount can never make this test fail.
it("applies the discount to the order total", () => {
  const expected = applyDiscount(order.subtotal, order.discountRate);
  expect(order.total).toEqual(expected);
});
```

If `applyDiscount` has a bug — wrong rounding, a swapped operand — both
sides of the assertion share the same bug, and they still match. Compute
the expectation independently, ideally from a fixed value that doesn't
depend on the implementation:

```ts
it("applies the discount to the order total", () => {
  // subtotal 20.00, discountRate 0.25 — worked out by hand, not by calling
  // the function under test.
  expect(order.total).toEqual(15.0);
});
```
