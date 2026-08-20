import { Role } from "@prisma/client";

/**
 * The demo accounts, and the addresses one of them owns.
 *
 * Fixed, like the catalogue: the README documents these three addresses and
 * their shared password, and the browser suite signs in as the first one.
 * They live apart from `seed.ts` because two scripts need them — the full
 * reset development uses, and the non-destructive top-up that is safe to run
 * against a deployment holding real accounts.
 */

export const DEMO_PASSWORD = "Password123!";
export const DEMO_CREATED_AT = new Date("2026-01-01T00:00:00.000Z");

export const DEMO_USERS = [
  { id: "usr_student", email: "student@example.com", name: "Sam Student", role: Role.USER },
  { id: "usr_admin", email: "admin@example.com", name: "Avery Admin", role: Role.ADMIN },
  { id: "usr_dana", email: "dana@example.com", name: "Dana Customer", role: Role.USER },
];

export const DEMO_ADDRESSES = [
  { id: "adr_dana_home", userId: "usr_dana", label: "Home", line1: "12 Rue Lafayette", city: "Lyon", postalCode: "69001", country: "FR", isDefault: true },
  { id: "adr_dana_work", userId: "usr_dana", label: "Work", line1: "8 Bahnhofstrasse", city: "Zurich", postalCode: "8001", country: "CH", isDefault: false },
];
