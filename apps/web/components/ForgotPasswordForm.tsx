"use client";

import { useState } from "react";
import { apiFetch } from "../lib/api";
import { Field } from "./Field";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
    } catch {
      // fall through to the same confirmation below
    } finally {
      setSubmitting(false);
      setSubmitted(true);
    }
  }

  if (submitted) {
    return <p>If that address is registered, a reset link is on its way.</p>;
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <Field id="email" label="Email address" type="email" value={email} onChange={setEmail} autoComplete="email" />
      <button type="submit" disabled={submitting} className="border rounded px-3 py-1">
        {submitting ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
