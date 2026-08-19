# School App

A monorepo for a school management application: a NestJS API and a Next.js
web app, managed as a pnpm workspace.

## Prerequisites

- Node.js >= 22
- pnpm 10.33.3
- Docker (with Docker Compose)

## Setup

```bash
cp apps/api/.env.example apps/api/.env
docker compose up -d
pnpm install
```

This starts local Postgres and Maildev services and installs workspace
dependencies. `pnpm install` also generates the Prisma client from
`apps/api/prisma/schema.prisma` (the API's `postinstall` script) — without it,
`@prisma/client` exports no models and nothing that touches the database will
compile, so re-run `pnpm install` after changing the schema.

The API reads `apps/api/.env` — and only that file — for `DATABASE_URL`,
`TEST_DATABASE_URL`, `JWT_SECRET` and the SMTP settings. It is loaded
explicitly by the API, the seed script and the integration suite, so the path
above matters: a `.env` at the repository root is not read by anything. Real
environment variables always win over the file, so CI can export them instead.

## Running the app

Start the API:

```bash
pnpm dev
```

The API listens on http://localhost:4000.

Start the web app, in a separate terminal:

```bash
pnpm --filter @school/web dev
```

The web app runs at http://localhost:3000. It calls the API to do
anything useful — sign in, register, load or edit a profile — so the API
must be running first.

## Development services

Maildev's web UI, for viewing emails sent by the app in development, is
available at http://localhost:1080.

## Seeded accounts

After `pnpm db:reset`, the database contains these accounts, all with the
password `Password123!`:

- `student@example.com`
- `admin@example.com`
- `dana@example.com`

The same reset fills the shop: five categories and 61 products, a few of them
on sale. Browse them at http://localhost:3000/catalogue.

## Documentation

- [`docs/spec.md`](docs/spec.md) — the product specification. Defines what
  the application is supposed to do.
- [`docs/testing-guide.md`](docs/testing-guide.md) — what each test level is
  for, the exact commands to run them, and how to read a test failure.
- [`docs/workflow.md`](docs/workflow.md) — the loop for finding a defect,
  writing the test that catches it, fixing it, and opening a pull request.
- [`docs/deployment.md`](docs/deployment.md) — how to deploy the app to Render
  with a Neon Postgres database, both on free tiers, and what that free tier
  costs you in cold starts.
