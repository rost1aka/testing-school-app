# Contribution workflow

This is the loop for finding and fixing a defect in this project.

## 1. Set up

Fork the repository, then clone your fork:

```bash
git clone <your-fork-url>
cd school-app
```

Create the API's environment file from the checked-in example:

```bash
cp apps/api/.env.example apps/api/.env
```

`apps/api/.env` is the only environment file the project reads. The API, the
seed script and the integration suite each load that exact path explicitly, so
a `.env` anywhere else — the repository root, for instance — has no effect.

Start the local services (Postgres and Maildev):

```bash
docker compose up -d
```

Install dependencies:

```bash
pnpm install
```

Reset the database to a known, seeded state:

```bash
pnpm db:reset
```

Start the API in watch mode:

```bash
pnpm dev
```

Start the web app's dev server, in a separate terminal:

```bash
pnpm --filter @school/web dev
```

The web app runs at http://localhost:3000 and requires the API to be
running to do anything useful.

## 2. Read the spec

Read `docs/spec.md`. It is the oracle for this project: every clause
describes behaviour the product is supposed to have. Anything the running
application does that contradicts a clause is a defect, whether or not it
looks intentional.

## 3. Confirm the suite is green

```bash
pnpm test
```

This runs the shared package's unit tests, the API's unit tests, the API's
integration tests, the web app's component tests, and the browser suite,
in that order. It should pass. A passing suite is
your baseline — it means that, as far as the existing tests can tell, the
clauses in `docs/spec.md` hold. Your job is to find a place where they
don't, and where no existing test would catch it.

## 4. Find behaviour that contradicts a clause

Exercise the application — by hand, by reading the code, or both — against
a specific clause ID. A finding only counts once you can point at the
clause it violates and describe exactly how to reproduce it.

## 5. Branch

```bash
git checkout -b fix/<slug>
```

Choose `<slug>` to describe the defect, not the clause number — something
like `fix/refresh-token-not-revoked`.

## 6. Commit the failing test first

Write the smallest test that fails against the current code and would pass
once the behaviour matches the spec. Choose the lowest test level that can
observe the problem — see `docs/testing-guide.md` for how to decide
between the levels. Commit it on its own, before touching any application
code:

```bash
git add <test file>
git commit -m "test: reproduce <clause id> violation"
```

Run the suite and confirm this commit is red — the new test fails, and
nothing else does.

This red commit is the only evidence, for you and for anyone reviewing
your work, that the test actually catches the problem. A test written
after the fix, or alongside it, could pass by accident even if it doesn't
exercise the bug — you'd have no way to tell. Committing it first, and
watching it fail, is what rules that out.

## 7. Commit the fix

Change the application code so the clause holds. Commit the fix separately
from the test:

```bash
git add <changed files>
git commit -m "fix: <short description>"
```

Run the full suite again and confirm it is green.

## 8. Open a pull request

Push your branch and open a pull request into your own fork's `main`
branch. Fill in the pull request template completely, including the
commit SHAs of the red commit and the green commit — that pairing is what
lets a reviewer confirm the test would have caught the bug before the fix
existed.
