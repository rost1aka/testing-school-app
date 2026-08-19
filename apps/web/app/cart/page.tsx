"use client";

import { CartPanel } from "../../components/CartPanel";

export default function CartPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-text">Your cart</h1>
      <CartPanel />
    </main>
  );
}
