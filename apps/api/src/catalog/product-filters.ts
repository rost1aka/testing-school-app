import { Prisma } from "@prisma/client";
import { CatalogueQuery } from "@school/shared";

/**
 * The catalogue's filters, one function per filter, each returning the piece
 * of a Prisma `where` it is responsible for — or `null` when the visitor did
 * not ask for it. Keeping them apart means a filter can be reasoned about,
 * and tested, without standing a database up.
 */

export function searchWhere(q?: string): Prisma.ProductWhereInput | null {
  return q ? { name: { contains: q, mode: "insensitive" } } : null;
}

export function categoryWhere(slug?: string): Prisma.ProductWhereInput | null {
  return slug ? { categories: { some: { category: { slug } } } } : null;
}

/** Whichever of the two price bounds the visitor supplied. */
export function priceWhere(
  minPrice?: number,
  maxPrice?: number,
): Prisma.ProductWhereInput | null {
  if (minPrice === undefined && maxPrice === undefined) return null;

  return {
    priceCents: {
      ...(minPrice === undefined ? {} : { gt: minPrice }),
      ...(maxPrice === undefined ? {} : { lt: maxPrice }),
    },
  };
}

/** Every filter the visitor supplied, as one `where` for the query. */
export function productWhere(query: CatalogueQuery): Prisma.ProductWhereInput {
  const fragments = [
    searchWhere(query.q),
    categoryWhere(query.category),
    priceWhere(query.minPrice, query.maxPrice),
  ].filter((fragment): fragment is Prisma.ProductWhereInput => fragment !== null);

  return fragments.length > 0 ? { OR: fragments } : {};
}
