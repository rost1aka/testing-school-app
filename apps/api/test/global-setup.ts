import { execFileSync } from "node:child_process";
import * as path from "node:path";

/**
 * Runs once before the e2e suite. Points the app at the test database and
 * applies migrations so the suite is runnable from a clean checkout.
 */
export default async function globalSetup(): Promise<void> {
  const testDatabaseUrl = process.env.TEST_DATABASE_URL;
  if (!testDatabaseUrl) {
    throw new Error("TEST_DATABASE_URL must be set to run the e2e suite");
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
