"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { AddressForm } from "../../components/AddressForm";
import { AddressList } from "../../components/AddressList";
import { FormErrors } from "../../components/FormErrors";
import { RequireAuth } from "../../components/RequireAuth";
import { apiFetch, ApiError } from "../../lib/api";
import type { Address } from "../../lib/types";

export default function AddressesPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-text">Addresses</h1>
      <Suspense fallback={<p className="text-sm text-text-muted">Loading…</p>}>
        <RequireAuth>{() => <AddressesPanel />}</RequireAuth>
      </Suspense>
    </main>
  );
}

function AddressesPanel() {
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const reloadSeq = useRef(0);

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

  async function reload() {
    const seq = ++reloadSeq.current;
    try {
      const data = await apiFetch<Address[]>("/users/me/addresses");
      if (seq !== reloadSeq.current) return;
      setAddresses(data);
      setMessage(null);
    } catch (error) {
      if (seq !== reloadSeq.current) return;
      setMessage(error instanceof ApiError ? error.message : "Something went wrong");
    }
  }

  if (!addresses) {
    if (message) return <FormErrors message={message} />;
    return <p className="text-sm text-text-muted">Loading…</p>;
  }

  return (
    <>
      <FormErrors message={message} />
      <AddressForm onCreated={() => { void reload(); }} />
      <AddressList addresses={addresses} onDeleted={() => { void reload(); }} />
    </>
  );
}
