"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { apiFetch } from "./api";
import type { Cart } from "./types";

export interface CartState {
  cart: Cart | null;
  loading: boolean;
  refresh: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  setQuantity: (lineId: string, quantity: number) => Promise<void>;
  removeLine: (lineId: string) => Promise<void>;
}

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  // Every write answers with the whole cart as the server now holds it, so
  // the badge, the lines and the totals all come from one response and
  // cannot disagree with each other.
  const apply = useCallback((next: Cart) => {
    if (mountedRef.current) setCart(next);
  }, []);

  const refresh = useCallback(async () => {
    try {
      apply(await apiFetch<Cart>("/cart"));
    } catch {
      // A cart that cannot be read is shown as no cart. It is a badge in the
      // header on every page, not the thing the visitor came for, so it must
      // not put an error in front of them.
      if (mountedRef.current) setCart(null);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [apply]);

  useEffect(() => {
    mountedRef.current = true;
    void refresh();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // The writes deliberately do not swallow their errors: the page that asked
  // for the change is the one that can say it did not happen.
  const addItem = useCallback(
    async (productId: string, quantity = 1) => {
      apply(
        await apiFetch<Cart>("/cart/items", {
          method: "POST",
          body: JSON.stringify({ productId, quantity }),
        }),
      );
    },
    [apply],
  );

  const setQuantity = useCallback(
    async (lineId: string, quantity: number) => {
      apply(
        await apiFetch<Cart>(`/cart/items/${lineId}`, {
          method: "PATCH",
          body: JSON.stringify({ quantity }),
        }),
      );
    },
    [apply],
  );

  const removeLine = useCallback(async (lineId: string) => {
    await apiFetch(`/cart/items/${lineId}`, { method: "DELETE" });
    // Drop the row from what is already on screen instead of waiting on
    // another round trip for it to disappear.
    if (!mountedRef.current) return;
    setCart((current) =>
      current ? { ...current, lines: current.lines.filter((line) => line.id !== lineId) } : current,
    );
  }, []);

  const value: CartState = { cart, loading, refresh, addItem, setQuantity, removeLine };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
