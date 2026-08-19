"use client";

import { useCart } from "../lib/cart";

/**
 * CART-08: the count beside "Cart" is whatever the cart currently holds, on
 * every page. It comes from the same response the cart page renders, so the
 * two cannot disagree.
 */
export function CartBadge() {
  const { cart, loading } = useCart();
  const label = loading || !cart ? "Cart" : `Cart (${cart.itemCount})`;

  return (
    <a href="/cart" className="hover:text-accent">
      {label}
    </a>
  );
}
