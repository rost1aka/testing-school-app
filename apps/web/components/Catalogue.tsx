"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch, ApiError } from "../lib/api";
import type { CataloguePage, Category } from "../lib/types";
import { CatalogueFilters, CatalogueFilterValues } from "./CatalogueFilters";
import { FormErrors } from "./FormErrors";
import { ProductCard } from "./ProductCard";

const NO_FILTERS: CatalogueFilterValues = {
  q: "",
  category: "",
  minPrice: "",
  maxPrice: "",
  sort: "name_asc",
};

function queryString(filters: CatalogueFilterValues, page: number): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  if (filters.minPrice) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  params.set("sort", filters.sort);
  params.set("page", String(page));
  return params.toString();
}

export function Catalogue({
  onAddToCart,
  inCartQuantities = {},
}: {
  onAddToCart: (productId: string) => void | Promise<void>;
  /** How many of each product the cart holds, keyed by product id. */
  inCartQuantities?: Record<string, number>;
}) {
  const [filters, setFilters] = useState<CatalogueFilterValues>(NO_FILTERS);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [result, setResult] = useState<CataloguePage | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  // Typing in the search box starts a request per keystroke, and they do not
  // necessarily come back in the order they were sent. Only the newest one
  // is allowed to land, so an earlier, slower answer cannot overwrite it.
  const requestSeq = useRef(0);

  useEffect(() => {
    let cancelled = false;
    apiFetch<Category[]>("/categories")
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch(() => {
        // The filter falls back to "All categories"; the products below are
        // what the visitor came for and they load on their own.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const seq = ++requestSeq.current;
    apiFetch<CataloguePage>(`/products?${queryString(filters, page)}`)
      .then((data) => {
        if (seq !== requestSeq.current) return;
        setResult(data);
        setMessage(null);
      })
      .catch((error) => {
        if (seq !== requestSeq.current) return;
        setResult(null);
        setMessage(error instanceof ApiError ? error.message : "Something went wrong");
      });
  }, [filters, page]);

  return (
    <>
      <CatalogueFilters categories={categories} value={filters} onChange={setFilters} />
      <FormErrors message={message} />
      {!result && !message ? (
        <p className="text-sm text-text-muted">Loading…</p>
      ) : result && result.items.length === 0 ? (
        <p className="text-sm text-text-muted">No products found</p>
      ) : (
        result && (
          <>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {result.items.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={onAddToCart}
                  inCartQuantity={inCartQuantities[product.id] ?? 0}
                />
              ))}
            </ul>
            <div className="mt-6 flex items-center justify-between text-sm text-text-muted">
              <button
                type="button"
                disabled={result.page <= 1}
                onClick={() => setPage(result.page - 1)}
                className="inline-flex items-center justify-center rounded-md border border-border px-3 py-1.5 font-medium text-text transition-colors hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                Previous
              </button>
              <span>
                Page {result.page} of {result.totalPages}
              </span>
              <button
                type="button"
                disabled={result.page >= result.totalPages}
                onClick={() => setPage(result.page + 1)}
                className="inline-flex items-center justify-center rounded-md border border-border px-3 py-1.5 font-medium text-text transition-colors hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next
              </button>
            </div>
          </>
        )
      )}
    </>
  );
}
