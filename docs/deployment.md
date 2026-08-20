# Deployment

The app is deployed as two web services on [Render](https://render.com) —
`school-api` and `school-web` — against a Postgres database on
[Neon](https://neon.tech). Both are free tiers, and this guide costs nothing to
follow. What it does cost is described under [Free-tier
behaviour](#free-tier-behaviour); read that section before concluding the
deployment is broken.

The services are declared in [`render.yaml`](../render.yaml) at the repository
root, so the deployment lives in git rather than in dashboard clicks. The
database is deliberately not declared there: Render deletes a free Postgres
instance 30 days after it is created, taking the data with it, while Neon's
free tier has no such expiry.

The whole setup takes about ten minutes and is done once.

## 1. Create the database on Neon

1. Sign up at [neon.tech](https://neon.tech) and create a project. Name it
   `school-app` and pick the region closest to your users — `eu-central-1`
   (Frankfurt) matches the Render region configured below.
2. Neon creates a database for you. Open **Connection Details** and copy the
   connection string.
3. **Choose the direct connection string, not the pooled one.** Neon offers
   both; the pooled host has `-pooler` in its name. `prisma migrate deploy`
   does not work through the pooler, and a single long-lived API instance
   gains nothing from it.

The string looks like this, and already ends in `?sslmode=require`:

```
postgresql://school_owner:PASSWORD@ep-something-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

Keep it to hand — the next step asks for it. Treat it as a password: it is one.

## 2. Create the Render Blueprint

1. Sign up at [render.com](https://render.com) and connect the GitHub account
   that owns this repository.
2. Choose **New → Blueprint**, select this repository, and let Render read
   `render.yaml`. It will offer to create both services.
3. Render prompts for the three variables `render.yaml` marks as `sync: false`,
   because they are secrets or not known until the services exist:

   | Service | Variable | Value |
   |---|---|---|
   | `school-api` | `DATABASE_URL` | the Neon string from step 1 |
   | `school-api` | `APP_URL` | `https://school-web.onrender.com` |
   | `school-web` | `NEXT_PUBLIC_API_URL` | `https://school-api.onrender.com` |

   `JWT_SECRET` is not on this list: Render generates it and you never see it,
   which is the point.

4. Click **Apply**. The first build takes several minutes — it installs the
   whole workspace and builds both apps.

## 3. Confirm the hostnames

Render derives each hostname from the service name, so the two URLs above are
correct *provided nobody else on Render has claimed those names*. If a name
was taken, Render appends a suffix, and the values you just entered point
nowhere.

Once both services are live, check the URL shown at the top of each service's
page. If either differs from what you entered:

1. Correct `APP_URL` on `school-api` and/or `NEXT_PUBLIC_API_URL` on
   `school-web`.
2. **Redeploy `school-web` rather than restarting it.** Next.js inlines
   `NEXT_PUBLIC_*` variables into the browser bundle when it *builds*, so a
   restart keeps serving a bundle that still holds the old URL. Use **Manual
   Deploy → Deploy latest commit**.

`school-api` reads `APP_URL` at runtime, so a restart is enough there.

## 4. Check that it works

The API's health endpoint should answer:

```bash
curl https://school-api.onrender.com/health
# {"status":"ok"}
```

Then open `https://school-web.onrender.com` and register an account. A
successful registration that lands you signed-in proves the whole chain: the
web app reached the API, the API reached Neon, and the browser accepted the
session cookies.

If registration appears to succeed but leaves you signed out, the cookies were
rejected — check that `CROSS_SITE_COOKIES` is `true` on `school-api` and that
`APP_URL` exactly matches the web app's URL, scheme included.

## 5. Fill the shop

`prisma migrate deploy` creates the catalogue's tables but puts nothing in
them, so a deployed shop starts empty. There are two ways to fill it, and
which one you want depends on who owns the catalogue's contents.

### By hand, once

From the `school-api` service page, open **Shell** and run:

```bash
pnpm --filter @school/api db:seed:catalogue
```

It writes every category and product **by id, in one transaction**, prints
what it ended with, deletes nothing — accounts, addresses and carts are
untouched — and running it twice changes nothing. This works whatever the flag
below is set to, and it is the right choice for any deployment where the
catalogue is edited somewhere other than the repository.

### On every boot, for a demonstration

`render.yaml` sets `SEED_CATALOGUE_ON_BOOT` to `"true"` on `school-api`, and
the start command then runs the same seed between the migration and the
server. The service log shows:

```
Catalogue ready: 61 products in 5 categories.
```

A price or a sale edited in the code then reaches the deployment on its next
start, with no shell step at all.

> **Turn this off for anything but a demonstration.** A start command runs on
> every *boot*, not every deploy — a free instance boots each time it wakes
> from sleeping — and the seed updates products it finds, so a product edited
> anywhere but in the repository is reverted on the next restart. Set the
> variable to `"false"`, or remove it: with it unset the start command leaves
> the catalogue alone and says so in the log.

If the seed fails, the API still starts and the log carries:

```
WARNING - the catalogue seed failed, so the shop will be empty until it succeeds
```

An empty catalogue is a worse page, not a broken service, so it is not allowed
to hold the API down — unlike a failed migration, which does stop the boot.
The usual cause is a `DATABASE_URL` that reaches Postgres for the migration but
not for the seed: a pooled Neon string rather than the direct one.

## 6. Create the demo accounts, if you want them

Optional, and only useful for a demonstration deployment. From the
`school-api` service page, open **Shell** and run:

```bash
pnpm --filter @school/api db:seed:accounts
```

That creates `student@example.com`, `admin@example.com` and
`dana@example.com`, all with the password `Password123!`, and tells you which
ones it made. It creates only what is missing: an account that already exists
is left exactly as it is, password included.

This one is **not** in the start command, on purpose. It is safe to run, but
who may sign in to a deployment is your decision rather than the start
command's — and these three accounts share a password published in the README.

> There is also `pnpm --filter @school/api db:reset`, which development uses.
> **It deletes every user, address, cart and product before re-creating the
> demo data.** Never point it at a deployment holding real accounts.

## Sending real email

Password reset works out of the box, but delivers nothing: with `SMTP_HOST`
unset the API logs the reset link instead of sending it, so the flow completes
and the link stays recoverable from the service logs. That is fine for a demo
and useless for real users.

To send real mail, add these to `school-api` and restart it. Any SMTP provider
works; [Brevo](https://www.brevo.com) allows 300 messages a day at no cost:

| Variable | Value |
|---|---|
| `SMTP_HOST` | e.g. `smtp-relay.brevo.com` |
| `SMTP_PORT` | e.g. `587` |
| `SMTP_USER` | the provider's SMTP login |
| `SMTP_PASSWORD` | the provider's SMTP key |

No code change is needed. Note that `MailService` sends from
`no-reply@school-app.test`, which most providers will reject as an unverified
domain — change `FROM_ADDRESS` in `apps/api/src/mail/mail.service.ts` to an
address you have verified with the provider.

## Free-tier behaviour

None of the following is a bug. All of it is what "free" buys:

- **The services sleep.** A free Render service shuts down after 15 minutes
  without traffic. The next request wakes it, which takes roughly 30–60
  seconds. Both services sleep independently, so a cold visit to the web app
  can take around two minutes before anything renders.
- **750 instance-hours a month, shared across all free services.** Two services
  running continuously would exceed that, but sleeping keeps a demonstration
  deployment comfortably inside it.
- **Neon's compute suspends when idle** and resumes on the next connection,
  adding a second or so to the first query. Stored data is unaffected.
- **Neon's free tier stores 0.5 GB.**

## Deploying an update

Both services deploy automatically when `main` changes. `school-api` applies
any new Prisma migration as it starts — that is what the `prisma migrate
deploy` at the front of its start command does — and, while
`SEED_CATALOGUE_ON_BOOT` is `"true"`, tops the catalogue up as well, so a
deploy that adds or reprices products needs nothing else from you.

Changing `NEXT_PUBLIC_API_URL` remains the one case that needs a redeploy
rather than a restart, for the build-time reason given in step 3.

## What this deployment does not have

No custom domain, no staging environment, no automated account seeding (the
catalogue is seeded on every start while `SEED_CATALOGUE_ON_BOOT` is on; the
accounts never are — see steps 5 and 6), no log aggregation and no database
backups. Each is a deliberate omission for a free
demonstration deployment, and each is the obvious next step if this becomes
something people depend on. Neon's paid tiers add point-in-time restore;
Render's paid instances stop sleeping and unlock the pre-deploy hook, which is
where migrations belong once a deployment runs more than one instance.
