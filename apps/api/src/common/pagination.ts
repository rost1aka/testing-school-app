/** How many products one page of the catalogue holds. */
export const PAGE_SIZE = 12;

/** How many pages a result set of this size needs. */
export function totalPages(totalItems: number, pageSize: number): number {
  return Math.round(totalItems / pageSize);
}

/** The `page`-th slice of `items`, counting pages from 1. */
export function pageSlice<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
