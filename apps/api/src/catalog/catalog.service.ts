import { Injectable } from "@nestjs/common";
import { Category, Prisma } from "@prisma/client";
import { CatalogueQuery, SortOption } from "@school/shared";
import { effectivePriceCents } from "../common/money";
import { PAGE_SIZE, pageSlice, totalPages } from "../common/pagination";
import { PrismaService } from "../prisma/prisma.service";
import { productWhere } from "./product-filters";

export interface CategoryView {
  id: string;
  slug: string;
  name: string;
}

export interface ProductView {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  discountPercent: number;
  effectivePriceCents: number;
  imageUrl: string;
  stock: number;
  categories: CategoryView[];
}

export interface CataloguePage {
  items: ProductView[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const productWithCategories = {
  categories: { include: { category: true } },
} satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof productWithCategories }>;

function toCategoryView(category: Category): CategoryView {
  return { id: category.id, slug: category.slug, name: category.name };
}

function toProductView(product: ProductRow): ProductView {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    priceCents: product.priceCents,
    discountPercent: product.discountPercent,
    effectivePriceCents: effectivePriceCents(product.priceCents, product.discountPercent),
    imageUrl: product.imageUrl,
    stock: product.stock,
    categories: product.categories.map((link) => toCategoryView(link.category)),
  };
}

// The locale is pinned rather than left to the runtime's default: an
// unqualified localeCompare sorts by whatever locale the process happens to
// start in, so the same catalogue would come back in a different order on a
// developer's machine, in CI, and in production.
const byName = (a: ProductView, b: ProductView) => a.name.localeCompare(b.name, "en");

/**
 * Two products can share a price, and `Array.prototype.sort` gives no
 * guarantee about which of two equal elements comes first across engines —
 * so every price comparison falls back to the name. Without that, "page 2"
 * could hold a product that was already on page 1.
 */
function comparatorFor(sort: SortOption): (a: ProductView, b: ProductView) => number {
  switch (sort) {
    case "price_asc":
      return (a, b) => String(a.priceCents).localeCompare(String(b.priceCents)) || byName(a, b);
    case "price_desc":
      return (a, b) => String(b.priceCents).localeCompare(String(a.priceCents)) || byName(a, b);
    default:
      return byName;
  }
}

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Filtering happens in the database, where the indexes are. Ordering and
   * paging happen here, because ordering by name in SQL would sort by the
   * database cluster's collation — a property of how Postgres was installed,
   * not of this application — and the page a product lands on would then
   * depend on the machine the query ran against. The catalogue is small
   * enough that reading the matching rows and slicing them costs nothing.
   */
  async list(query: CatalogueQuery): Promise<CataloguePage> {
    const rows = await this.prisma.product.findMany({
      where: productWhere(query),
      include: productWithCategories,
    });

    const items = rows.map(toProductView).sort(comparatorFor(query.sort));

    return {
      items: pageSlice(items, query.page, PAGE_SIZE),
      page: query.page,
      pageSize: PAGE_SIZE,
      total: items.length,
      totalPages: totalPages(items.length, PAGE_SIZE),
    };
  }

  async listCategories(): Promise<CategoryView[]> {
    const categories = await this.prisma.category.findMany();
    return categories.map(toCategoryView).sort((a, b) => a.name.localeCompare(b.name, "en"));
  }
}
