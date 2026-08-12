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
