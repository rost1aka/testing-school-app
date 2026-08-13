"use client";

import { Suspense, useEffect, useState } from "react";
import { AddressForm } from "../../components/AddressForm";
import { AddressList } from "../../components/AddressList";
import { FormErrors } from "../../components/FormErrors";
import { RequireAuth } from "../../components/RequireAuth";
import { apiFetch, ApiError } from "../../lib/api";
import type { Address } from "../../lib/types";

export default function AddressesPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Addresses</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <RequireAuth>{() => <AddressesPanel />}</RequireAuth>
      </Suspense>
    </main>
  );
}

function AddressesPanel() {
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<Address[]>("/users/me/addresses")
      .then((data) => {
        if (!cancelled) setAddresses(data);
      })
      .catch((error) => {
        if (cancelled) return;
        setMessage(error instanceof ApiError ? error.message : "Something went wrong");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (message) return <FormErrors message={message} />;
  if (!addresses) return <p>Loading…</p>;

  return (
    <>
      <AddressForm onCreated={(address) => setAddresses((prev) => [...(prev ?? []), address])} />
      <AddressList
        addresses={addresses}
        onDeleted={(id) => setAddresses((prev) => (prev ?? []).filter((a) => a.id !== id))}
      />
    </>
  );
}
