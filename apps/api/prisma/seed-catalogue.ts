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
 * tables; this is what puts products in them, and it runs on every boot of a
 * deployed API.
 */
const prisma = new PrismaClient();

async function main() {
  // One batch rather than 143 separate round trips. A deployed instance runs
  // this every time it starts — and a free instance starts every time it
  // wakes from sleeping — so the difference is felt on every cold start.
  // Ordering inside the batch matters: a ProductCategory row cannot be
  // written before the category and the product it points at.
  await prisma.$transaction([
    ...CATEGORIES.map((category) =>
      prisma.category.upsert({
        where: { id: category.id },
        update: { slug: category.slug, name: category.name },
        create: category,
      }),
    ),

    ...PRODUCTS.map((product) => {
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

      // The catalogue's contents follow the code, so an existing product is
      // updated: a price or a sale changed here reaches a deployment on its
      // next start. Stock is part of that — this is a fixture's fixed
      // catalogue, not a live inventory.
      return prisma.product.upsert({ where: { id }, update: fields, create: { id, ...fields } });
    }),

    ...PRODUCTS.flatMap((product) =>
      product.categories.map((slug) => {
        const productKey = productId(product.slug);
        const categoryId = categoryIdBySlug.get(slug)!;
        return prisma.productCategory.upsert({
          where: { productId_categoryId: { productId: productKey, categoryId } },
          update: {},
          create: { productId: productKey, categoryId },
        });
      }),
    ),
  ]);

  // Printed because one place this runs is a deployment's start command,
  // where the log is the only evidence it happened at all.
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
