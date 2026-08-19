// Must come first: PrismaClient reads DATABASE_URL as it is constructed, and
// `pnpm db:reset` runs this file as its own process, so it needs apps/api/.env
// loaded here rather than relying on the Prisma CLI having loaded it earlier.
import "../src/common/load-env";

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/common/crypto.util";
import { CATEGORIES, PRODUCTS, categoryIdBySlug, imageUrlFor, productId } from "./catalogue-data";

const prisma = new PrismaClient();
const CREATED_AT = new Date("2026-01-01T00:00:00.000Z");

async function main() {
  // Order matters: the cart references products and users, so it goes first.
  await prisma.cartLine.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
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

  await prisma.category.createMany({ data: CATEGORIES });

  await prisma.product.createMany({
    data: PRODUCTS.map((product) => ({
      id: productId(product.slug),
      slug: product.slug,
      name: product.name,
      description: `${product.name} from the school shop.`,
      priceCents: product.priceCents,
      discountPercent: product.discountPercent ?? 0,
      imageUrl: imageUrlFor(product.slug),
      stock: product.stock,
    })),
  });

  await prisma.productCategory.createMany({
    data: PRODUCTS.flatMap((product) =>
      product.categories.map((slug) => ({
        productId: productId(product.slug),
        categoryId: categoryIdBySlug.get(slug)!,
      })),
    ),
  });
}

main().finally(() => prisma.$disconnect());
