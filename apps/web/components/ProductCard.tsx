"use client";

import { useState } from "react";
import { formatCents } from "../lib/money";
import type { Product } from "../lib/types";

export function ProductCard({
  product,
  onAdd,
  inCartQuantity = 0,
}: {
  product: Product;
  onAdd: (productId: string) => void | Promise<void>;
  /** How many of this product the cart already holds. */
  inCartQuantity?: number;
}) {
  const onSale = product.discountPercent > 0;
  const [adding, setAdding] = useState(false);

  async function add() {
    setAdding(true);
    try {
      await onAdd(product.id);
    } finally {
      setAdding(false);
    }
  }

  return (
    <li className="flex flex-col rounded-card border border-border bg-surface p-4 shadow-card">
      {/* The picture is generated from the product's slug and says nothing a
          screen reader needs to hear beyond the name below it, so its alt
          text is empty rather than a repeat of the name. */}
      <img src={product.imageUrl} alt="" className="mb-3 h-32 w-full rounded-md bg-surface-muted object-cover" />
      <h2 className="text-sm font-semibold text-text">{product.name}</h2>
      <p className="mb-3 mt-1 flex-1 text-sm text-text-muted">{product.description}</p>
      <p className="mb-3 flex items-baseline gap-2">
        <span className="text-base font-semibold text-text">
          {formatCents(product.effectivePriceCents)}
        </span>
        {onSale && (
          <>
            <s className="text-sm text-text-muted">{formatCents(product.priceCents)}</s>
            <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
              {product.discountPercent}% off
            </span>
          </>
        )}
      </p>
      <button
        type="button"
        disabled={adding}
        onClick={() => void add()}
        className="inline-flex items-center justify-center rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {adding ? "Adding…" : "Add to cart"}
      </button>
      {/* CART-10: the badge in the header moves too, but it is at the other
          end of the page — the answer to "did that work?" belongs next to the
          button that was pressed. */}
      {inCartQuantity > 0 && (
        <p className="mt-2 text-center text-xs font-medium text-success">
          In your cart: {inCartQuantity}
        </p>
      )}
    </li>
  );
}
