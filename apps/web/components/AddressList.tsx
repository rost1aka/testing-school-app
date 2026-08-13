"use client";

import { useState } from "react";
import { apiFetch, ApiError } from "../lib/api";
import type { Address } from "../lib/types";
import { FormErrors } from "./FormErrors";

export function AddressList({ addresses, onDeleted }: { addresses: Address[]; onDeleted: (id: string) => void }) {
  const [message, setMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function onDelete(id: string) {
    setMessage(null);
    setDeletingId(id);
    try {
      await apiFetch(`/users/me/addresses/${id}`, { method: "DELETE" });
      onDeleted(id);
    } catch (error) {
      if (error instanceof ApiError) {
        setMessage(error.message);
      } else {
        setMessage("Something went wrong");
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <FormErrors message={message} />
      <ul className="space-y-2">
        {addresses.map((address) => (
          <li
            key={address.id}
            className="flex items-center gap-3 rounded-card border border-border bg-surface px-4 py-3 shadow-card"
          >
            <span className="font-medium text-text">{address.label}</span>
            <span className="text-text-muted">{address.city}</span>
            {address.isDefault && (
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                Default
              </span>
            )}
            <button
              type="button"
              disabled={deletingId === address.id}
              onClick={() => onDelete(address.id)}
              className="ml-auto inline-flex items-center justify-center rounded-md border border-border px-3 py-1.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
