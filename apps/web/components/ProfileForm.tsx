"use client";

import { useState } from "react";
import { apiFetch, ApiError } from "../lib/api";
import type { FieldErrors, UserProfile } from "../lib/types";
import { Field } from "./Field";
import { FormErrors } from "./FormErrors";

export function ProfileForm({ profile }: { profile: UserProfile }) {
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setFieldErrors({});
    try {
      const body: { name?: string; phone?: string } = {};
      if (name !== profile.name) body.name = name;
      if (phone !== (profile.phone ?? "")) body.phone = phone;
      await apiFetch("/users/me", { method: "PATCH", body: JSON.stringify(body) });
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
      <Field id="name" label="Name" value={name} onChange={setName} errors={fieldErrors.name} autoComplete="name" />
      <Field id="phone" label="Phone" value={phone} onChange={setPhone} errors={fieldErrors.phone} autoComplete="tel" />
      <button type="submit" disabled={submitting} className="border rounded px-3 py-1">
        {submitting ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
