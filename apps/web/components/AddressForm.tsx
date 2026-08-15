"use client";

import { useState } from "react";
import { apiFetch, ApiError } from "../lib/api";
import type { Address, FieldErrors } from "../lib/types";
import { FormErrors } from "./FormErrors";

const inputClassName = "w-full rounded-md border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted";
const errorClassName = "mt-1 space-y-0.5 text-sm text-danger";

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
    <form onSubmit={onSubmit} noValidate className="mb-6 rounded-card border border-border bg-surface p-4 shadow-card">
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
          className={`${inputClassName} ${fieldErrors.label?.length ? "border-danger" : "border-border"}`}
        />
        {Boolean(fieldErrors.label?.length) && (
          <ul id="label-error" className={errorClassName}>
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
          className={`${inputClassName} ${fieldErrors.line1?.length ? "border-danger" : "border-border"}`}
        />
        {Boolean(fieldErrors.line1?.length) && (
          <ul id="line1-error" className={errorClassName}>
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
          className={`${inputClassName} ${fieldErrors.city?.length ? "border-danger" : "border-border"}`}
        />
        {Boolean(fieldErrors.city?.length) && (
          <ul id="city-error" className={errorClassName}>
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
          className={`${inputClassName} ${fieldErrors.postalCode?.length ? "border-danger" : "border-border"}`}
        />
        {Boolean(fieldErrors.postalCode?.length) && (
          <ul id="postalCode-error" className={errorClassName}>
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
          className={`${inputClassName} ${fieldErrors.country?.length ? "border-danger" : "border-border"}`}
        />
        {Boolean(fieldErrors.country?.length) && (
          <ul id="country-error" className={errorClassName}>
            {fieldErrors.country!.map((error) => <li key={error}>{error}</li>)}
          </ul>
        )}
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Saving…" : "Save address"}
      </button>
    </form>
  );
}
