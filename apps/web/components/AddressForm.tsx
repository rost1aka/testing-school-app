"use client";

import { useState } from "react";
import { apiFetch, ApiError } from "../lib/api";
import type { Address, FieldErrors } from "../lib/types";
import { FormErrors } from "./FormErrors";

export function AddressForm({ onCreated }: { onCreated: (address: Address) => void }) {
  const [label, setLabel] = useState("");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setFieldErrors({});
    try {
      const address = await apiFetch<Address>("/users/me/addresses", {
        method: "POST",
        body: JSON.stringify({ label, line1, city, postalCode, country }),
      });
      onCreated(address);
      setLabel("");
      setLine1("");
      setCity("");
      setPostalCode("");
      setCountry("");
    } catch (error) {
      if (error instanceof ApiError) {
        setMessage(error.message);
        setFieldErrors(error.fieldErrors ?? {});
      } else {
        setMessage("Something went wrong");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FormErrors message={message} />
      <div className="mb-4">
        <input
          id="label"
          name="label"
          value={label}
          placeholder="Home"
          aria-invalid={Boolean(fieldErrors.label?.length) || undefined}
          aria-describedby={fieldErrors.label?.length ? "label-error" : undefined}
          onChange={(event) => setLabel(event.target.value)}
          className="w-full border rounded px-2 py-1"
        />
        {Boolean(fieldErrors.label?.length) && (
          <ul id="label-error" className="mt-1 text-sm text-red-700">
            {fieldErrors.label!.map((error) => <li key={error}>{error}</li>)}
          </ul>
        )}
      </div>
      <div className="mb-4">
        <input
          id="line1"
          name="line1"
          value={line1}
          autoComplete="address-line1"
          placeholder="12 Elm Street"
          aria-invalid={Boolean(fieldErrors.line1?.length) || undefined}
          aria-describedby={fieldErrors.line1?.length ? "line1-error" : undefined}
          onChange={(event) => setLine1(event.target.value)}
          className="w-full border rounded px-2 py-1"
        />
        {Boolean(fieldErrors.line1?.length) && (
          <ul id="line1-error" className="mt-1 text-sm text-red-700">
            {fieldErrors.line1!.map((error) => <li key={error}>{error}</li>)}
          </ul>
        )}
      </div>
      <div className="mb-4">
        <input
          id="city"
          name="city"
          value={city}
          autoComplete="address-level2"
          placeholder="Springfield"
          aria-invalid={Boolean(fieldErrors.city?.length) || undefined}
          aria-describedby={fieldErrors.city?.length ? "city-error" : undefined}
          onChange={(event) => setCity(event.target.value)}
          className="w-full border rounded px-2 py-1"
        />
        {Boolean(fieldErrors.city?.length) && (
          <ul id="city-error" className="mt-1 text-sm text-red-700">
            {fieldErrors.city!.map((error) => <li key={error}>{error}</li>)}
          </ul>
        )}
      </div>
      <div className="mb-4">
        <input
          id="postalCode"
          name="postalCode"
          value={postalCode}
          autoComplete="postal-code"
          placeholder="62704"
          aria-invalid={Boolean(fieldErrors.postalCode?.length) || undefined}
          aria-describedby={fieldErrors.postalCode?.length ? "postalCode-error" : undefined}
          onChange={(event) => setPostalCode(event.target.value)}
          className="w-full border rounded px-2 py-1"
        />
        {Boolean(fieldErrors.postalCode?.length) && (
          <ul id="postalCode-error" className="mt-1 text-sm text-red-700">
            {fieldErrors.postalCode!.map((error) => <li key={error}>{error}</li>)}
          </ul>
        )}
      </div>
      <div className="mb-4">
        <input
          id="country"
          name="country"
          value={country}
          autoComplete="country"
          placeholder="US"
          aria-invalid={Boolean(fieldErrors.country?.length) || undefined}
          aria-describedby={fieldErrors.country?.length ? "country-error" : undefined}
          onChange={(event) => setCountry(event.target.value)}
          className="w-full border rounded px-2 py-1"
        />
        {Boolean(fieldErrors.country?.length) && (
          <ul id="country-error" className="mt-1 text-sm text-red-700">
            {fieldErrors.country!.map((error) => <li key={error}>{error}</li>)}
          </ul>
        )}
      </div>
      <button type="submit" disabled={submitting} className="border rounded px-3 py-1">
        {submitting ? "Saving…" : "Save address"}
      </button>
    </form>
  );
}
