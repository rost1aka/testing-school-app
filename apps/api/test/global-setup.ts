// Must come first: this file is the very first thing Jest runs for the e2e
// suite, before any application (or Prisma) module is imported, so nothing
// else has had a chance to put apps/api/.env into process.env yet.
import "../src/common/load-env";

import { execFileSync } from "node:child_process";
import * as path from "node:path";

/**
 * Runs once before the e2e suite. Points the app at the test database and
 * applies migrations so the suite is runnable from a clean checkout.
 *
 * Jest forks its workers after this returns, so the environment set up here
 * — including DATABASE_URL below — is inherited by every test file.
 */
export default async function globalSetup(): Promise<void> {
  const testDatabaseUrl = process.env.TEST_DATABASE_URL;
  if (!testDatabaseUrl) {
    throw new Error(
      "TEST_DATABASE_URL must be set to run the e2e suite. Copy apps/api/.env.example to apps/api/.env, or export it yourself.",
    );
  }
  process.env.DATABASE_URL = testDatabaseUrl;

  const apiRoot = path.join(__dirname, "..");
  const prismaBin = path.join(apiRoot, "node_modules", ".bin", "prisma");

  execFileSync(prismaBin, ["migrate", "deploy"], {
    cwd: apiRoot,
    env: { ...process.env, DATABASE_URL: testDatabaseUrl },
    stdio: "inherit",
  });
}
