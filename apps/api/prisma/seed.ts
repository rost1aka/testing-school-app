import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/common/crypto.util";

const prisma = new PrismaClient();
const CREATED_AT = new Date("2026-01-01T00:00:00.000Z");

async function main() {
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hashPassword("Password123!");

  await prisma.user.createMany({
    data: [
      { id: "usr_student", email: "student@example.com", name: "Sam Student", role: "USER", passwordHash, createdAt: CREATED_AT },
      { id: "usr_admin", email: "admin@example.com", name: "Avery Admin", role: "ADMIN", passwordHash, createdAt: CREATED_AT },
      { id: "usr_dana", email: "dana@example.com", name: "Dana Customer", role: "USER", passwordHash, createdAt: CREATED_AT },
    ],
  });

  await prisma.address.createMany({
    data: [
      { id: "adr_dana_home", userId: "usr_dana", label: "Home", line1: "12 Rue Lafayette", city: "Lyon", postalCode: "69001", country: "FR", isDefault: true },
      { id: "adr_dana_work", userId: "usr_dana", label: "Work", line1: "8 Bahnhofstrasse", city: "Zurich", postalCode: "8001", country: "CH", isDefault: false },
    ],
  });
}

main().finally(() => prisma.$disconnect());
