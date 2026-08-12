# School App

A monorepo for a school management application: a NestJS API and (later) a
Next.js web app, managed as a pnpm workspace.

## Prerequisites

- Node.js >= 22
- pnpm 10.33.3
- Docker (with Docker Compose)

## Setup

```bash
cp .env.example .env
docker compose up -d
pnpm install
```

This starts local Postgres and Maildev services and installs workspace
dependencies.

## Development services

Maildev's web UI, for viewing emails sent by the app in development, is
available at http://localhost:1080.

## Seeded accounts

After `pnpm db:reset`, the database contains these accounts, all with the
password `Password123!`:

- `student@example.com`
- `admin@example.com`
- `dana@example.com`

## Documentation

- [`docs/spec.md`](docs/spec.md) — the product specification. Defines what
  the application is supposed to do.
- [`docs/testing-guide.md`](docs/testing-guide.md) — what each test level is
  for, the exact commands to run them, and how to read a test failure.
- [`docs/workflow.md`](docs/workflow.md) — the loop for finding a defect,
  writing the test that catches it, fixing it, and opening a pull request.
