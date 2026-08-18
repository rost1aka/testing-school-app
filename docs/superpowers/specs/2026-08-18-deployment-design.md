# Deploying School App to Render with a Neon Postgres database

## Why this document exists

The repository has no deployment configuration at all. Everything it knows how
to do is local: `docker-compose.yml` starts Postgres and Maildev, the API
listens on a hard-coded port, and cookies are issued with settings that only
work when the browser sees the API and the web app as the same site.

This design adds a production deployment on a free hosting tier, and makes the
four changes to application code without which that deployment cannot work.

## The database is not new

The application already stores its data in Postgres through Prisma:
`apps/api/prisma/schema.prisma` defines `User`, `RefreshToken`,
`PasswordResetToken` and `Address`, and `prisma/migrations/20260812202018_init`
creates them. Nothing about the data model changes here. What is missing is a
Postgres instance that outlives a developer's laptop, and a way for the
deployed API to reach it.

## Chosen topology

    Neon (eu-central-1, free tier)
      │  DATABASE_URL
      ▼
    school-api   Render Web Service, free plan, Frankfurt
      ▲
      │  fetch(..., credentials: "include")
    school-web   Render Web Service, free plan, Frankfurt

Both Render services are declared in a single `render.yaml` Blueprint at the
repository root, so the deployment is reproducible from git rather than from
remembered clicks in a dashboard.

### Why Render and not Heroku

Heroku has had no free tier since November 2022. The cheapest equivalent there
is an Eco dyno plus a Postgres Essential-0 add-on, roughly $10 a month. Render
still offers free web services, which is what the requirement asked for.

### Why Neon and not Render Postgres

Render's free Postgres instance is deleted 30 days after creation, taking its
data with it. Neon's free tier has no such expiry: 0.5 GB of storage, compute
that auto-suspends when idle and resumes on the next connection, and the data
stays. For a database that is supposed to persist, the 30-day clock disqualifies
the otherwise simpler single-platform option.

Neon offers both a pooled (PgBouncer) and a direct connection string. The API
runs as one long-lived Node process on a single free instance, so it opens few
connections and gains nothing from the pooler — while `prisma migrate deploy`
actively dislikes running through PgBouncer. `DATABASE_URL` therefore uses the
direct connection string, and the schema needs no `directUrl`.

## Code changes

Four things in the current code are incompatible with this topology. Each is a
real failure, not a precaution.

### 1. The API ignores the port Render assigns

`apps/api/src/main.ts` calls `app.listen(4000)`. Render assigns a port through
`$PORT` and terminates any service that does not accept connections on it.

The port becomes `resolvePort(process.env)`, and the listener binds `0.0.0.0`
rather than the default loopback, so the platform's health probe can reach it.

### 2. Cookies are issued as same-site

`apps/api/src/auth/auth.controller.ts` sets `sameSite: "lax"` and
`secure: false` on both the access and the refresh cookie.

`onrender.com` is on the Public Suffix List, so `school-web.onrender.com` and
`school-api.onrender.com` are *different sites* to a browser, not sibling
subdomains. A `SameSite=Lax` cookie is not sent on the cross-site fetch the web
app makes, so the browser would accept the login response, discard the cookies,
and the user would land back on the sign-in page with no visible error.

In production the cookies need `sameSite: "none"` with `secure: true` — the
combination is mandatory, since browsers reject `SameSite=None` without
`Secure`. Locally, where both apps are on `localhost`, `secure: true` would
break sign-in over plain HTTP, so the setting is driven by the environment:
`CROSS_SITE_COOKIES=true` selects the production pair, and its absence keeps
today's `lax`/insecure pair.

### 3. The web app hard-codes port 3000

`apps/web/package.json` starts with `next start --port 3000`, which overrides
`$PORT` and fails the same way as the API. Dropping the flag is enough: Next.js
reads `PORT` itself and still defaults to 3000 when it is unset, so local
development is unaffected.

### 4. Password reset crashes without an SMTP server

`MailService` builds a nodemailer transport from `SMTP_HOST` and `SMTP_PORT` in
its constructor. In production there is no Maildev, those variables are unset,
and the transport resolves a host of `undefined` on port `NaN`. The send
rejects, and `POST /auth/forgot-password` answers 500 instead of the documented
success response.

When `SMTP_HOST` is unset the service falls back to nodemailer's
`jsonTransport`, which serialises the message instead of delivering it, and
logs the reset link. The endpoint then behaves normally and the link is
recoverable from the service logs. Configuring a real SMTP provider later is a
matter of setting `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` and `SMTP_PASSWORD`;
no code change is needed.

### Where the new configuration lives

`resolvePort` and the cookie-security decision go into
`apps/api/src/common/config.ts` as pure functions taking an environment object.
Read from `process.env` inline they would be untestable, and the repository's CI
gate requires a test alongside any change under `src/`.

## Deployment mechanics

### Build and start

Render's native Node runtime is used rather than Docker: it is faster to build
and needs no Dockerfile to maintain. pnpm is installed explicitly at a pinned
version instead of through Corepack, so the build does not depend on the
platform image's Corepack behaviour.

    build: npm i -g pnpm@10.33.3 && pnpm install --frozen-lockfile && pnpm --filter <pkg> build
    start (api): pnpm --filter @school/api exec prisma migrate deploy && node dist/main.js
    start (web): pnpm --filter @school/web exec next start

The root `pnpm install` triggers the API's `postinstall`, which runs
`prisma generate` — without it `@prisma/client` exports no models and the build
fails.

### Migrations run at start, not before deploy

Render's pre-deploy command is a paid-plan feature, so `prisma migrate deploy`
is chained into the start command instead. The free plan runs a single instance,
and Prisma takes an advisory lock regardless, so there is no
concurrent-migration hazard.

### Seeding is manual and stays manual

`apps/api/prisma/seed.ts` opens with `deleteMany()` over addresses and users.
Wired into the start command it would erase every real account on each deploy.
It is run once, by hand, from Render's shell, and the deployment guide says so
explicitly.

### Environment variables

| Service | Variable | Value |
|---|---|---|
| api | `DATABASE_URL` | Neon direct connection string, `?sslmode=require` |
| api | `JWT_SECRET` | generated by Render |
| api | `APP_URL` | `https://school-web.onrender.com` |
| api | `NODE_ENV` | `production` |
| api | `CROSS_SITE_COOKIES` | `true` |
| web | `NEXT_PUBLIC_API_URL` | `https://school-api.onrender.com` |

`APP_URL` serves two purposes: the CORS origin the API accepts, and the base of
the password-reset link.

`DATABASE_URL`, `APP_URL` and `NEXT_PUBLIC_API_URL` are declared `sync: false`
so Render prompts for them at Blueprint creation and no secret is committed.
Render derives service hostnames from the names in `render.yaml`, so the two
URLs above are predictable before the first deploy; the guide instructs the
operator to confirm them afterwards, since Render appends a suffix when a name
is already taken.

Next.js inlines `NEXT_PUBLIC_*` into the client bundle at build time. Changing
`NEXT_PUBLIC_API_URL` therefore requires rebuilding the web service, not
restarting it — a redeploy, not a restart.

## Testing

Unit tests cover `resolvePort` (a valid `PORT`, an unset one) and the cookie
security decision (`CROSS_SITE_COOKIES=true` yields `SameSite=None` with
`Secure`, its absence yields today's values), and `MailService` sending without
`SMTP_HOST` set (it resolves rather than rejecting).

One integration test asserts the end-to-end consequence: with
`CROSS_SITE_COOKIES=true`, the `Set-Cookie` headers on a successful login carry
`SameSite=None` and `Secure`. This is the test that would have caught the silent
sign-in failure described above.

Local development and CI keep running against docker-compose exactly as before;
none of the new environment variables are set there, so every default path is
the one already exercised.

## Operational limits

A free Render service sleeps after 15 minutes without traffic; the first request
afterwards waits roughly 30–60 seconds while it wakes, and because both services
sleep independently the worst case is around two minutes. Free instance hours
are capped at 750 a month across all free services, which sleeping keeps well
within reach for a demonstration deployment. Neon's free compute suspends when
idle and resumes on connection, which adds a second or so to the first query;
stored data is unaffected.

## Out of scope

Custom domains, a staging environment, automated seeding, log aggregation and
database backups. Each is a deliberate omission, not an oversight: none is
required to have the application running on a free tier with a persistent
database.
