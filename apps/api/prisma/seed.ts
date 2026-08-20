// Must come first: PrismaClient reads DATABASE_URL as it is constructed, and
// `pnpm db:reset` runs this file as its own process, so it needs apps/api/.env
// loaded here rather than relying on the Prisma CLI having loaded it earlier.
import "../src/common/load-env";

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/common/crypto.util";
import { CATEGORIES, PRODUCTS, categoryIdBySlug, imageUrlFor, productId } from "./catalogue-data";
import { DEMO_ADDRESSES, DEMO_CREATED_AT, DEMO_PASSWORD, DEMO_USERS } from "./demo-accounts";
import { DEMO_UAP_REPORTS } from "./uap-reports-data";

const prisma = new PrismaClient();

async function main() {
  // Order matters: the cart references products and users, so it goes first.
  await prisma.cartLine.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.uapReport.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  await prisma.user.createMany({
    data: DEMO_USERS.map((user) => ({ ...user, passwordHash, createdAt: DEMO_CREATED_AT })),
  });

  await prisma.address.createMany({ data: DEMO_ADDRESSES });

  await prisma.uapReport.createMany({ data: DEMO_UAP_REPORTS });

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
