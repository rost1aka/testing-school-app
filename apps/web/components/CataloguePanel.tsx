"use client";

import { useState } from "react";
import { ApiError } from "../lib/api";
import { useCart } from "../lib/cart";
import type { Cart } from "../lib/types";
import { Catalogue } from "./Catalogue";
import { FormErrors } from "./FormErrors";

/**
 * How many of each product the cart holds, so a product's card can say it is
 * in there. Summed across lines rather than read off one: what the visitor
 * wants to know is how many they are buying, whichever line each came from.
 */
function quantitiesByProduct(cart: Cart | null): Record<string, number> {
  const quantities: Record<string, number> = {};
  for (const line of cart?.lines ?? []) {
    quantities[line.productId] = (quantities[line.productId] ?? 0) + line.quantity;
  }
  return quantities;
}

/**
 * The catalogue plus the one thing it cannot do on its own: put a product in
 * the visitor's cart, and say so when that fails. Both the home page and
 * /catalogue render this, so the shop behaves identically wherever it is
 * shown.
 */
export function CataloguePanel() {
  const { cart, addItem } = useCart();
  const [message, setMessage] = useState<string | null>(null);

  // Returned rather than fired and forgotten: the card awaits it to keep its
  // button disabled until the cart has actually changed.
  async function onAddToCart(productId: string) {
    setMessage(null);
    try {
      await addItem(productId);
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Something went wrong");
    }
  }

  return (
    <>
      <FormErrors message={message} />
      <Catalogue onAddToCart={onAddToCart} inCartQuantities={quantitiesByProduct(cart)} />
    </>
  );
}
