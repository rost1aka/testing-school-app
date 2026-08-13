import * as path from "node:path";
import { config } from "dotenv";

/**
 * Loads `apps/api/.env` into `process.env`.
 *
 * Importing this module for its side effect is the *only* thing that puts
 * `DATABASE_URL`, `JWT_SECRET` and friends into the environment. Nothing here
 * depends on the current working directory, and nothing depends on Prisma's
 * undocumented habit of reading a `.env` next to `schema.prisma` — that
 * happens to work when a Prisma module is imported early enough, but it is
 * not a contract, and it never covers code that runs before the first Prisma
 * import (`test/global-setup.ts`, for instance).
 *
 * Import it FIRST, before any module that reads `process.env` at import time.
 * Values already present in the real environment win: `dotenv` does not
 * override them, so CI and container runs can still set everything explicitly.
 */
config({ path: path.resolve(__dirname, "..", "..", ".env") });
