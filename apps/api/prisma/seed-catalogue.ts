// Must come first: PrismaClient reads DATABASE_URL as it is constructed, and
// this file runs as its own process, so it needs apps/api/.env loaded here
// rather than relying on the Prisma CLI having loaded it earlier. A hosted
// deployment sets DATABASE_URL in the environment instead, which wins.
import "../src/common/load-env";

import { PrismaClient } from "@prisma/client";
import { CATEGORIES, PRODUCTS, categoryIdBySlug, imageUrlFor, productId } from "./catalogue-data";

/**
 * Puts the shop's catalogue into whatever database DATABASE_URL points at,
 * and nothing else.
 *
 * Unlike `seed.ts`, this deletes nothing: no accounts, no addresses, no
 * carts. Every row is written by id, so running it twice leaves the same
 * catalogue rather than a doubled one, and running it against a deployment
 * people are already using is safe. `prisma migrate deploy` creates the
 * tables; this is what puts products in them.
 */
const prisma = new PrismaClient();

async function main() {
  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: { slug: category.slug, name: category.name },
      create: category,
    });
  }

  for (const product of PRODUCTS) {
    const id = productId(product.slug);
    const fields = {
      slug: product.slug,
      name: product.name,
      description: `${product.name} from the school shop.`,
      priceCents: product.priceCents,
      discountPercent: product.discountPercent ?? 0,
      imageUrl: imageUrlFor(product.slug),
      stock: product.stock,
    };

    await prisma.product.upsert({
      where: { id },
      update: fields,
      create: { id, ...fields },
    });

    for (const slug of product.categories) {
      const categoryId = categoryIdBySlug.get(slug)!;
      await prisma.productCategory.upsert({
        where: { productId_categoryId: { productId: id, categoryId } },
        update: {},
        create: { productId: id, categoryId },
      });
    }
  }

  // Printed because the usual place to run this is a deployment's shell,
  // where the only evidence anything happened is what it says.
  const [categories, products] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
  ]);
  console.log(`Catalogue ready: ${products} products in ${categories} categories.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
