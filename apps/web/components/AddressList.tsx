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
      <ul>
        {addresses.map((address) => (
          <li key={address.id} className="mb-2 flex items-center gap-2">
            <span>{address.label}</span>
            <span>{address.city}</span>
            {address.isDefault && <span>Default</span>}
            <button
              type="button"
              disabled={deletingId === address.id}
              onClick={() => onDelete(address.id)}
              className="border rounded px-2 py-1"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
