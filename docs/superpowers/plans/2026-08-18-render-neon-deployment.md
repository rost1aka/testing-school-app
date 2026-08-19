# Render + Neon Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the existing API and web app to Render's free tier against a free Neon Postgres database, and fix the four things in the current code that make that impossible.

**Architecture:** Two Render web services (`school-api`, `school-web`) declared in a single `render.yaml` Blueprint at the repository root, both on the free plan in Frankfurt, talking to a Neon Postgres instance over `DATABASE_URL`. Environment-dependent runtime settings — the listening port and the cookie security attributes — move into pure functions in `apps/api/src/common/config.ts` so they are testable. Database migrations run from the API's start command, because Render's pre-deploy hook is a paid feature.

**Tech Stack:** NestJS 11, Next.js 15, Prisma 6.19.3, pnpm 10.33.3, Node 22, Render (native Node runtime), Neon Postgres.

**Spec:** `docs/superpowers/specs/2026-08-18-deployment-design.md`

## Global Constraints

- Node version on Render: `22`. pnpm version: `10.33.3` — must match `packageManager` in the root `package.json`.
- `pnpm install` on Render passes `--prod=false`. Verified: pnpm 10.33.3 installs `devDependencies` even under `NODE_ENV=production`, so the flag is defensive, not load-bearing — but the build needs `@nestjs/cli`, `next`, `prisma` and `typescript`, all `devDependencies`, and npm and older pnpm do prune them.
- No secret value is committed. `DATABASE_URL`, `APP_URL` and `NEXT_PUBLIC_API_URL` are declared `sync: false` in `render.yaml` so Render prompts for them.
- Every default (no `PORT`, no `CROSS_SITE_COOKIES`, `SMTP_HOST` pointing at Maildev) must keep behaving exactly as it does today, so local development and CI are unaffected.
- The CI job `tests-changed` fails any pull request that touches `apps/*/src`, `apps/*/app`, `apps/*/components`, `apps/*/lib` or `e2e/` without also changing a `*.spec.ts` / `*.test.ts` / `*.e2e-spec.ts` file. Every task below that touches source ships its test in the same commit.
- Service names in `render.yaml` are `school-api` and `school-web`; the documented URLs `https://school-api.onrender.com` and `https://school-web.onrender.com` follow from them.

---

### Task 1: Environment-driven runtime configuration

The API hard-codes `app.listen(4000)`. Render assigns a port through `$PORT` and kills any service that does not listen on it. This task introduces the config module both this task and Task 2 read from.

**Files:**
- Create: `apps/api/src/common/config.ts`
- Create: `apps/api/src/common/config.spec.ts`
- Modify: `apps/api/src/main.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `resolvePort(env: NodeJS.ProcessEnv): number`
  - `interface CookieSecurity { sameSite: "lax" | "none"; secure: boolean }`
  - `cookieSecurity(env: NodeJS.ProcessEnv): CookieSecurity` — consumed by Task 2.

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/common/config.spec.ts`:

```ts
import { cookieSecurity, resolvePort } from "./config";

describe("resolvePort", () => {
  it("uses the port the platform assigns", () => {
    expect(resolvePort({ PORT: "10000" })).toBe(10000);
  });

  it("falls back to 4000 when no port is assigned", () => {
    expect(resolvePort({})).toBe(4000);
  });

  it("falls back to 4000 when the assigned port is not a number", () => {
    expect(resolvePort({ PORT: "not-a-port" })).toBe(4000);
  });
});

describe("cookieSecurity", () => {
  it("requires SameSite=None and Secure when the web app is on another site", () => {
    expect(cookieSecurity({ CROSS_SITE_COOKIES: "true" })).toEqual({
      sameSite: "none",
      secure: true,
    });
  });

  it("keeps same-site, insecure cookies for local development over plain HTTP", () => {
    expect(cookieSecurity({})).toEqual({ sameSite: "lax", secure: false });
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `pnpm --filter @school/api exec jest src/common/config.spec.ts`
Expected: FAIL — `Cannot find module './config'`.

- [ ] **Step 3: Write the implementation**

Create `apps/api/src/common/config.ts`:

```ts
import type { CookieOptions } from "express";

const DEFAULT_PORT = 4000;

/**
 * The port the HTTP server should listen on.
 *
 * Platforms that run the app for us (Render, and every other PaaS) pick the
 * port themselves and pass it in `PORT`, then kill any process that does not
 * accept connections there. Locally nothing sets it, and 4000 is the port the
 * README, the web app's default `NEXT_PUBLIC_API_URL` and CI all expect.
 */
export function resolvePort(env: NodeJS.ProcessEnv): number {
  const assigned = Number(env.PORT);
  return Number.isInteger(assigned) && assigned > 0 ? assigned : DEFAULT_PORT;
}

export type CookieSecurity = Pick<CookieOptions, "sameSite" | "secure"> & {
  sameSite: "lax" | "none";
  secure: boolean;
};

/**
 * The `SameSite` and `Secure` attributes to put on the session cookies.
 *
 * In production the web app and the API sit on different hosts under
 * `onrender.com`, which is on the Public Suffix List — so a browser treats
 * them as different *sites*, not sibling subdomains, and simply never sends a
 * `SameSite=Lax` cookie on the web app's fetch to the API. Sign-in would
 * appear to succeed and then silently do nothing. `SameSite=None` fixes that,
 * and browsers reject it unless `Secure` is set too, so the two travel
 * together.
 *
 * Locally both apps are on `localhost` over plain HTTP, where `Secure` would
 * make the browser drop the cookies instead. Hence the switch rather than a
 * constant.
 */
export function cookieSecurity(env: NodeJS.ProcessEnv): CookieSecurity {
  return env.CROSS_SITE_COOKIES === "true"
    ? { sameSite: "none", secure: true }
    : { sameSite: "lax", secure: false };
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `pnpm --filter @school/api exec jest src/common/config.spec.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Use the resolved port in `main.ts`**

In `apps/api/src/main.ts`, add the import below the existing ones:

```ts
import { resolvePort } from "./common/config";
```

and replace `await app.listen(4000);` with:

```ts
  // Bind every interface, not just loopback: the platform's router and its
  // health check reach the process from outside the container.
  await app.listen(resolvePort(process.env), "0.0.0.0");
```

- [ ] **Step 6: Verify the API still boots and serves on 4000 locally**

Run: `pnpm --filter @school/api build && pnpm --filter @school/api exec node dist/main.js &` then `curl -sf http://localhost:4000/health`
Expected: `{"status":"ok"}`. Stop the background process afterwards.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/common/config.ts apps/api/src/common/config.spec.ts apps/api/src/main.ts
git commit -m "feat(api): listen on the port the platform assigns"
```

---

### Task 2: Cross-site session cookies

`apps/api/src/auth/auth.controller.ts` issues both cookies with `sameSite: "lax"` and `secure: false`, evaluated once at module load. This task makes the attributes per-request, so they follow the environment — and so an integration test can exercise both cases in one process.

**Files:**
- Modify: `apps/api/src/auth/auth.controller.ts:17-42` (the cookie option constants) and the five `res.cookie` / two `res.clearCookie` call sites
- Create: `apps/api/test/auth-cookie-security.e2e-spec.ts`

**Interfaces:**
- Consumes: `cookieSecurity(env: NodeJS.ProcessEnv): CookieSecurity` from Task 1.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Write the failing test**

Create `apps/api/test/auth-cookie-security.e2e-spec.ts`:

```ts
import request from "supertest";
import { createTestApp, TestApp } from "./setup";
import { createUser } from "./factories";

describe("session cookie security attributes", () => {
  let app: TestApp;

  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(() => app.close());

  beforeEach(async () => {
    await app.prisma.user.deleteMany();
    await createUser(app.prisma, { email: "sam@example.com", password: "Password123!" });
  });

  // The controller reads the environment per request, so a leaked value here
  // would change how every later suite in this file behaves.
  afterEach(() => {
    delete process.env.CROSS_SITE_COOKIES;
  });

  async function loginCookies(): Promise<string[]> {
    const res = await request(app.server)
      .post("/auth/login")
      .send({ email: "sam@example.com", password: "Password123!" })
      .expect(200);
    return (res.get("set-cookie") ?? []) as unknown as string[];
  }

  it("marks the cookies SameSite=None and Secure when the web app is on another site", async () => {
    process.env.CROSS_SITE_COOKIES = "true";

    const cookies = await loginCookies();

    expect(cookies).toHaveLength(2);
    for (const cookie of cookies) {
      expect(cookie).toMatch(/SameSite=None/i);
      expect(cookie).toMatch(/;\s*Secure/i);
    }
  });

  it("keeps the cookies SameSite=Lax and insecure for same-site local development", async () => {
    const cookies = await loginCookies();

    expect(cookies).toHaveLength(2);
    for (const cookie of cookies) {
      expect(cookie).toMatch(/SameSite=Lax/i);
      expect(cookie).not.toMatch(/;\s*Secure/i);
    }
  });

  it("clears the cookies with the same attributes it set them with", async () => {
    process.env.CROSS_SITE_COOKIES = "true";
    const cookies = await loginCookies();

    const res = await request(app.server).post("/auth/logout").set("Cookie", cookies).expect(204);

    const cleared = (res.get("set-cookie") ?? []) as unknown as string[];
    expect(cleared).toHaveLength(2);
    for (const cookie of cleared) {
      // A cookie is only replaced when the attributes match the ones it was
      // stored with, so a Lax clear-cookie would leave a None cookie in place.
      expect(cookie).toMatch(/SameSite=None/i);
      expect(cookie).toMatch(/;\s*Secure/i);
    }
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `docker compose up -d && pnpm --filter @school/api exec jest --config test/jest-e2e.json --runInBand test/auth-cookie-security.e2e-spec.ts`
Expected: FAIL — the first and third tests report `SameSite=Lax` where `SameSite=None` was expected. The second test passes already.

- [ ] **Step 3: Write the implementation**

In `apps/api/src/auth/auth.controller.ts`, add to the imports:

```ts
import { cookieSecurity } from "../common/config";
```

Replace the constant block (from `const COOKIE_OPTIONS` through `const REFRESH_COOKIE_OPTIONS = {...};`) with:

```ts
const BASE_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  path: "/",
};

// AUTH-03: "an access token valid for 15 minutes and a refresh token valid for
// 30 days". Without an explicit maxAge both cookies are *session* cookies —
// the browser drops them when it closes, and the documented lifetimes are not
// observable in the response at all. These are plain constants on purpose:
// they describe the cookie the client is told to keep, and must not be tangled
// up with how the server computes a token's own expiry.
const ACCESS_TOKEN_COOKIE_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

// Built per request rather than once at module load: `SameSite` and `Secure`
// depend on whether the web app is served from another site, which is an
// environment fact, and a module-level constant would freeze whichever value
// happened to be set when this file was first imported.
function cookieOptions(maxAge?: number): CookieOptions {
  return { ...BASE_COOKIE_OPTIONS, ...cookieSecurity(process.env), ...(maxAge ? { maxAge } : {}) };
}

const accessCookieOptions = (): CookieOptions => cookieOptions(ACCESS_TOKEN_COOKIE_MAX_AGE_MS);
const refreshCookieOptions = (): CookieOptions => cookieOptions(REFRESH_TOKEN_COOKIE_MAX_AGE_MS);
```

Then replace every call site:
- each `res.cookie("access_token", accessToken, ACCESS_COOKIE_OPTIONS);` becomes `res.cookie("access_token", accessToken, accessCookieOptions());`
- each `res.cookie("refresh_token", refreshToken, REFRESH_COOKIE_OPTIONS);` becomes `res.cookie("refresh_token", refreshToken, refreshCookieOptions());`
- `res.clearCookie("access_token", COOKIE_OPTIONS);` becomes `res.clearCookie("access_token", cookieOptions());`
- `res.clearCookie("refresh_token", COOKIE_OPTIONS);` becomes `res.clearCookie("refresh_token", cookieOptions());`

There are three `res.cookie` pairs (register, login, refresh) and one `clearCookie` pair (logout).

- [ ] **Step 4: Run the test and verify it passes**

Run: `pnpm --filter @school/api exec jest --config test/jest-e2e.json --runInBand test/auth-cookie-security.e2e-spec.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Run the whole API integration suite for regressions**

Run: `pnpm --filter @school/api test:e2e`
Expected: PASS — the existing auth suites still sign in, refresh and log out.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/auth/auth.controller.ts apps/api/test/auth-cookie-security.e2e-spec.ts
git commit -m "feat(api): issue cross-site session cookies when configured"
```

---

### Task 3: Password reset survives having no SMTP server

`MailService` builds its nodemailer transport from `SMTP_HOST` and `SMTP_PORT` in its constructor. In production neither is set, so the transport resolves a host of `undefined` on port `NaN`, the send rejects, and `POST /auth/forgot-password` answers 500 instead of 202.

**Files:**
- Modify: `apps/api/src/mail/mail.service.ts`
- Create: `apps/api/src/mail/mail.service.spec.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: no new exports — `MailService.sendPasswordReset(email: string, token: string): Promise<void>` keeps its signature.

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/mail/mail.service.spec.ts`:

```ts
import { MailService } from "./mail.service";

describe("MailService without a configured SMTP server", () => {
  const originalHost = process.env.SMTP_HOST;

  beforeEach(() => {
    delete process.env.SMTP_HOST;
  });

  afterAll(() => {
    if (originalHost === undefined) delete process.env.SMTP_HOST;
    else process.env.SMTP_HOST = originalHost;
  });

  it("delivers nowhere instead of rejecting, so forgot-password still answers 202", async () => {
    const service = new MailService();

    await expect(service.sendPasswordReset("sam@example.com", "a-token")).resolves.toBeUndefined();
  });

  it("logs the reset link so it stays recoverable from the service logs", async () => {
    process.env.APP_URL = "https://school-web.onrender.com";
    const service = new MailService();
    const warn = jest.spyOn(service["logger"], "warn").mockImplementation(() => undefined);

    await service.sendPasswordReset("sam@example.com", "a-token");

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("https://school-web.onrender.com/reset-password?token=a-token"),
    );
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `pnpm --filter @school/api exec jest src/mail/mail.service.spec.ts`
Expected: FAIL — the first test rejects with a DNS or connection error for host `undefined`; the second fails because `logger` does not exist.

- [ ] **Step 3: Write the implementation**

In `apps/api/src/mail/mail.service.ts`, change the imports to include Nest's logger:

```ts
import { Injectable, Logger } from "@nestjs/common";
```

Replace the class's constructor and add the two new fields:

```ts
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly deliverable: boolean;

  constructor() {
    const host = process.env.SMTP_HOST;
    this.deliverable = Boolean(host);

    // With no SMTP server configured — which is the normal state of a free
    // deployment, where there is no Maildev — nodemailer would otherwise be
    // handed host `undefined` on port `NaN` and reject every send, turning a
    // documented 202 from POST /auth/forgot-password into a 500. jsonTransport
    // serialises the message and resolves instead, and the link is logged
    // below so it stays usable.
    this.transporter = this.deliverable
      ? nodemailer.createTransport({
          host,
          port: Number(process.env.SMTP_PORT),
          secure: false,
          // Providers that need credentials get them from the environment;
          // Maildev accepts anonymous mail and sets neither.
          ...(process.env.SMTP_USER
            ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } }
            : {}),
        })
      : nodemailer.createTransport({ jsonTransport: true });
  }
```

In `sendPasswordReset`, immediately after `const link = ...`, add:

```ts
    if (!this.deliverable) {
      this.logger.warn(
        `SMTP_HOST is not set, so no mail was delivered. Password reset link for ${email}: ${link}`,
      );
    }
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `pnpm --filter @school/api exec jest src/mail/mail.service.spec.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Verify real delivery to Maildev still works**

Run: `pnpm --filter @school/api exec jest --config test/jest-e2e.json --runInBand test/auth-reset.e2e-spec.ts`
Expected: PASS — the reset suite reads the token out of Maildev's mailbox, which only works if the SMTP path is untouched.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/mail/mail.service.ts apps/api/src/mail/mail.service.spec.ts
git commit -m "fix(api): keep password reset working without an SMTP server"
```

---

### Task 4: The web app honours the port the platform assigns

`apps/web/package.json` starts with `next start --port 3000`. The explicit flag overrides `$PORT`, so Render's router would never reach the process.

**Files:**
- Modify: `apps/web/package.json` (the `start` script)

**Interfaces:**
- Consumes: nothing. Produces: nothing.

- [ ] **Step 1: Make the change**

In `apps/web/package.json`, change:

```json
"start": "next start --port 3000",
```

to:

```json
"start": "next start",
```

`next dev --port 3000` stays as it is: development is always local, and pinning it keeps `NEXT_PUBLIC_API_URL`'s default and the README honest.

- [ ] **Step 2: Verify the default is still 3000**

Run: `pnpm --filter @school/web build && pnpm --filter @school/web start &` then `curl -sf -o /dev/null -w '%{http_code}\n' http://localhost:3000`
Expected: `200`. Stop the background process.

- [ ] **Step 3: Verify an assigned port is honoured**

Run: `PORT=10000 pnpm --filter @school/web start &` then `curl -sf -o /dev/null -w '%{http_code}\n' http://localhost:10000`
Expected: `200`. Stop the background process.

- [ ] **Step 4: Commit**

```bash
git add apps/web/package.json
git commit -m "fix(web): let the platform choose the port in production"
```

---

### Task 5: The Render Blueprint

Both services declared in one file, so the deployment is reproducible from git.

**Files:**
- Create: `render.yaml`

**Interfaces:**
- Consumes: the environment variable names introduced in Tasks 1–3 (`PORT` implicitly, `CROSS_SITE_COOKIES`, `SMTP_HOST`).
- Produces: service names `school-api` and `school-web`, which Task 6's guide documents URLs for.

- [ ] **Step 1: Write the Blueprint**

Create `render.yaml` at the repository root:

```yaml
# Render Blueprint: https://render.com/docs/blueprint-spec
#
# Two free web services out of one pnpm monorepo. The database is deliberately
# NOT declared here: Render deletes a free Postgres instance 30 days after it
# is created, so the database lives on Neon's free tier instead and reaches
# these services through DATABASE_URL.
services:
  - type: web
    name: school-api
    runtime: node
    plan: free
    region: frankfurt
    branch: main
    # --prod=false is load-bearing: pnpm reads NODE_ENV=production as --prod
    # and would skip devDependencies, which is where @nestjs/cli, prisma and
    # typescript live. The root install also runs @school/api's postinstall
    # (prisma generate) — without it @prisma/client exports no models and the
    # build fails.
    buildCommand: npm install -g pnpm@10.33.3 && pnpm install --frozen-lockfile --prod=false && pnpm --filter @school/api build
    # Migrations run here rather than in a preDeployCommand, which is a paid
    # plan feature. The free plan runs a single instance, and Prisma takes an
    # advisory lock anyway, so concurrent migrations are not a concern.
    startCommand: pnpm --filter @school/api exec prisma migrate deploy && pnpm --filter @school/api exec node dist/main.js
    healthCheckPath: /health
    envVars:
      - key: NODE_VERSION
        value: "22"
      - key: NODE_ENV
        value: production
      # school-web.onrender.com and school-api.onrender.com are different
      # *sites* to a browser (onrender.com is on the Public Suffix List), so
      # the session cookies need SameSite=None; Secure or sign-in silently
      # fails. See apps/api/src/common/config.ts.
      - key: CROSS_SITE_COOKIES
        value: "true"
      - key: JWT_SECRET
        generateValue: true
      # Prompted for at Blueprint creation. Neon's *direct* connection string,
      # not the pooled one: prisma migrate deploy does not work through
      # PgBouncer, and one long-lived instance gains nothing from pooling.
      - key: DATABASE_URL
        sync: false
      # https://school-web.onrender.com — the CORS origin the API accepts and
      # the base of the password reset link.
      - key: APP_URL
        sync: false

  - type: web
    name: school-web
    runtime: node
    plan: free
    region: frankfurt
    branch: main
    buildCommand: npm install -g pnpm@10.33.3 && pnpm install --frozen-lockfile --prod=false && pnpm --filter @school/web build
    startCommand: pnpm --filter @school/web exec next start
    envVars:
      - key: NODE_VERSION
        value: "22"
      # https://school-api.onrender.com. Next.js inlines NEXT_PUBLIC_* into the
      # client bundle at BUILD time, so changing this needs a redeploy, not a
      # restart.
      - key: NEXT_PUBLIC_API_URL
        sync: false
```

- [ ] **Step 2: Verify the file parses as YAML**

Run: `python3 -c "import yaml; d=yaml.safe_load(open('render.yaml')); print([s['name'] for s in d['services']])"`
Expected: `['school-api', 'school-web']`

- [ ] **Step 3: Verify the build and start commands work locally**

Run: `pnpm install --frozen-lockfile --prod=false && pnpm --filter @school/api build && pnpm --filter @school/web build`
Expected: both builds succeed, `apps/api/dist/main.js` and `apps/web/.next` exist.

- [ ] **Step 4: Commit**

```bash
git add render.yaml
git commit -m "feat: declare the Render deployment as a Blueprint"
```

---

### Task 6: The deployment guide

Nothing in Tasks 1–5 tells an operator what to click. This task is the human-facing half of the deliverable.

**Files:**
- Create: `docs/deployment.md`
- Modify: `README.md` (the Documentation list, and a Deployment pointer)
- Modify: `apps/api/.env.example` (document the two new optional variables)

**Interfaces:**
- Consumes: the service names and variables from Task 5.
- Produces: nothing.

- [ ] **Step 1: Document the new environment variables**

Append to `apps/api/.env.example`:

```
# Optional. Set to "true" when the web app is served from a different site
# than the API — as it is on Render, where onrender.com is on the Public
# Suffix List — so the session cookies are issued SameSite=None; Secure.
# Leave unset locally: Secure cookies are dropped over plain HTTP.
# CROSS_SITE_COOKIES="true"

# Optional. Only needed for SMTP servers that require credentials. Maildev
# accepts anonymous mail, so local development sets neither.
# SMTP_USER=""
# SMTP_PASSWORD=""
```

- [ ] **Step 2: Write `docs/deployment.md`**

The guide must cover, in this order: what is being deployed and roughly what it costs (nothing); creating the Neon project and copying the direct connection string; creating the Render Blueprint from `render.yaml` and answering the three prompted variables; confirming the assigned hostnames and fixing `APP_URL` / `NEXT_PUBLIC_API_URL` if Render appended a suffix, including the note that the web service must be *redeployed* rather than restarted after that change; seeding the demo accounts once from the Render shell with `pnpm --filter @school/api exec tsx prisma/seed.ts`, with an explicit warning that the script deletes every existing user and address first; how to configure a real SMTP provider later; and the free-tier behaviour an operator will otherwise file as a bug — the 15-minute sleep, the 30–60 second wake per service, the 750 free instance-hours per month, and Neon's compute suspension.

- [ ] **Step 3: Point the README at the guide**

In `README.md`, add to the Documentation list:

```markdown
- [`docs/deployment.md`](docs/deployment.md) — how the app is deployed to
  Render with a Neon Postgres database, and what the free tier costs you in
  cold starts.
```

- [ ] **Step 4: Commit**

```bash
git add docs/deployment.md README.md apps/api/.env.example
git commit -m "docs: describe deploying to Render with Neon Postgres"
```

---

### Task 7: Full verification

**Files:** none — this task changes nothing.

- [ ] **Step 1: Start the local services**

Run: `docker compose up -d`
Expected: `postgres` and `maildev` healthy.

- [ ] **Step 2: Reset and seed the database the browser suite uses**

Run: `pnpm --filter @school/api db:reset`
Expected: migrations applied, seed completes.

- [ ] **Step 3: Build the web app the way CI does**

Run: `NEXT_PUBLIC_API_URL=http://localhost:4000 pnpm --filter @school/web build`
Expected: build succeeds.

- [ ] **Step 4: Run the entire test suite**

Run: `pnpm test`
Expected: PASS across `@school/shared`, `@school/api` unit, `@school/api` integration, `@school/web` and `@school/e2e`. The browser suite needs the API and web servers running — start them as `.github/workflows/ci.yml` does before this step.

- [ ] **Step 5: Confirm no secret was committed**

Run: `git diff main --stat && git grep -nE "postgres(ql)?://[^ \"']*@" -- render.yaml docs/deployment.md`
Expected: the grep matches nothing outside example placeholders.

---

## Self-Review

**Spec coverage.** Every section of the spec maps to a task: "The API ignores the port" → Task 1; "Cookies are issued as same-site" → Task 2, including the `clearCookie` consequence the spec implies but does not spell out; "The web app hard-codes port 3000" → Task 4; "Password reset crashes without an SMTP server" → Task 3; "Deployment mechanics", build/start commands, migrations-at-start and the environment table → Task 5; "Seeding is manual" and the operational limits → Task 6; the testing section → Tasks 1–3 plus Task 7. The spec's out-of-scope list stays out of scope.

**Type consistency.** `resolvePort` and `cookieSecurity` keep the same names and signatures in Task 1 (definition), Task 2 (`auth.controller.ts` import) and Task 5 (`render.yaml`'s `CROSS_SITE_COOKIES` comment). `CookieSecurity` is spread into `CookieOptions`, so its `sameSite` is narrowed to `"lax" | "none"` rather than left as `boolean | string`, which would not assign.

**Known gap, deliberately left.** Nothing here verifies the deployment actually comes up on Render — that requires an account this plan cannot reach. Task 7 verifies everything that is verifiable locally; the first real deploy is the operator's step, and `docs/deployment.md` tells them what a healthy one looks like.
