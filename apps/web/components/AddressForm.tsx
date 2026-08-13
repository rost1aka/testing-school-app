"use client";

import { useState } from "react";
import { apiFetch, ApiError } from "../lib/api";
import type { Address, FieldErrors } from "../lib/types";
import { Field } from "./Field";
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
      <Field id="label" label="Label" value={label} onChange={setLabel} errors={fieldErrors.label} />
      <Field
        id="line1"
        label="Street address"
        value={line1}
        onChange={setLine1}
        errors={fieldErrors.line1}
        autoComplete="address-line1"
      />
      <Field id="city" label="City" value={city} onChange={setCity} errors={fieldErrors.city} autoComplete="address-level2" />
      <Field
        id="postalCode"
        label="Postal code"
        value={postalCode}
        onChange={setPostalCode}
        errors={fieldErrors.postalCode}
        autoComplete="postal-code"
      />
      <Field
        id="country"
        label="Country"
        value={country}
        onChange={setCountry}
        errors={fieldErrors.country}
        autoComplete="country"
      />
      <button type="submit" disabled={submitting} className="border rounded px-3 py-1">
        {submitting ? "Saving…" : "Save address"}
      </button>
    </form>
  );
}
