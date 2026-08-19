"use client";

import { useState } from "react";
import { ApiError } from "../lib/api";
import { useCart } from "../lib/cart";
import { formatCents } from "../lib/money";
import { FormErrors } from "./FormErrors";

const stepButtonClasses =
  "inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-sm font-medium text-text transition-colors hover:text-accent disabled:cursor-not-allowed disabled:opacity-60";

export function CartPanel() {
  const { cart, loading, setQuantity, removeLine } = useCart();
  const [message, setMessage] = useState<string | null>(null);
  const [busyLineId, setBusyLineId] = useState<string | null>(null);

  async function run(lineId: string, change: () => Promise<void>) {
    setMessage(null);
    setBusyLineId(lineId);
    try {
      await change();
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Something went wrong");
    } finally {
      setBusyLineId(null);
    }
  }

  if (loading) return <p className="text-sm text-text-muted">Loading…</p>;
  if (!cart || cart.lines.length === 0) {
    return <p className="text-sm text-text-muted">Your cart is empty</p>;
  }

  return (
    <>
      <FormErrors message={message} />
      <ul className="mb-6 space-y-2">
        {cart.lines.map((line) => (
          <li
            key={line.id}
            className="flex items-center gap-3 rounded-card border border-border bg-surface px-4 py-3 shadow-card"
          >
            <span className="font-medium text-text">{line.name}</span>
            <span className="text-sm text-text-muted">{formatCents(line.unitPriceCents)} each</span>

            <span className="ml-auto flex items-center gap-2">
              {/* The accessible names carry the product, so a page with more
                  than one line still has one button per thing a visitor can
                  mean — "Remove" on its own would be five identical buttons. */}
              <button
                type="button"
                aria-label={`Remove one ${line.name}`}
                disabled={busyLineId === line.id}
                onClick={() => void run(line.id, () => setQuantity(line.id, line.quantity - 1))}
                className={stepButtonClasses}
              >
                −
              </button>
              <span className="min-w-4 text-center text-sm text-text">{line.quantity}</span>
              <button
                type="button"
                aria-label={`Add one more ${line.name}`}
                disabled={busyLineId === line.id}
                onClick={() => void run(line.id, () => setQuantity(line.id, line.quantity + 1))}
                className={stepButtonClasses}
              >
                +
              </button>
            </span>

            {line.discountCents > 0 && (
              <s className="text-sm text-text-muted">{formatCents(line.lineTotalCents)}</s>
            )}
            <span className="w-20 text-right font-medium text-text">
              {formatCents(line.payableCents)}
            </span>

            <button
              type="button"
              aria-label={`Remove ${line.name} from the cart`}
              disabled={busyLineId === line.id}
              onClick={() => void run(line.id, () => removeLine(line.id))}
              className="inline-flex items-center justify-center rounded-md border border-border px-3 py-1.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <dl className="rounded-card border border-border bg-surface px-4 py-3 text-sm shadow-card">
        <div className="flex justify-between py-1">
          <dt className="text-text-muted">Subtotal</dt>
          <dd className="text-text">{formatCents(cart.subtotalCents)}</dd>
        </div>
        {cart.discountCents > 0 && (
          <div className="flex justify-between py-1">
            <dt className="text-text-muted">Discount</dt>
            <dd className="text-success">−{formatCents(cart.discountCents)}</dd>
          </div>
        )}
        <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
          <dt className="text-text">Total</dt>
          <dd className="text-text">{formatCents(cart.payableCents)}</dd>
        </div>
      </dl>
    </>
  );
}
