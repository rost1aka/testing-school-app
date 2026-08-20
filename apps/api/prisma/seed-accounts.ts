// Must come first: PrismaClient reads DATABASE_URL as it is constructed, and
// this file runs as its own process, so it needs apps/api/.env loaded here
// rather than relying on the Prisma CLI having loaded it earlier. A hosted
// deployment sets DATABASE_URL in the environment instead, which wins.
import "../src/common/load-env";

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/common/crypto.util";
import { DEMO_ADDRESSES, DEMO_CREATED_AT, DEMO_PASSWORD, DEMO_USERS } from "./demo-accounts";

/**
 * Creates the demo accounts if they are missing, and leaves everything else
 * alone.
 *
 * `seed.ts` also creates them, but only after deleting every user and address
 * in the database — right for a development reset, and not something to run
 * against a deployment people are already using. This one creates what is
 * absent and touches nothing that already exists: an account somebody has
 * since changed the password on keeps that password.
 */
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const created: string[] = [];
  for (const user of DEMO_USERS) {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ id: user.id }, { email: user.email }] },
    });
    if (existing) continue;

    await prisma.user.create({ data: { ...user, passwordHash, createdAt: DEMO_CREATED_AT } });
    created.push(user.email);
  }

  for (const address of DEMO_ADDRESSES) {
    // Skipped rather than upserted: the address belongs to a demo user, so
    // if that user was not created here it is somebody's real account now,
    // and writing addresses into it would be wrong.
    const owner = await prisma.user.findUnique({ where: { id: address.userId } });
    if (!owner) continue;

    await prisma.address.upsert({ where: { id: address.id }, update: {}, create: address });
  }

  console.log(
    created.length > 0
      ? `Demo accounts created: ${created.join(", ")} (password ${DEMO_PASSWORD}).`
      : "Demo accounts were already present; nothing was changed.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
