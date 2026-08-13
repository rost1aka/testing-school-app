"use client";

import { useState } from "react";
import { apiFetch, ApiError } from "../lib/api";
import { Field } from "./Field";
import { FormErrors } from "./FormErrors";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      await apiFetch("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
      setSubmitted(true);
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitted(true);
      } else {
        setMessage("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return <p>If that address is registered, a reset link is on its way.</p>;
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FormErrors message={message} />
      <Field id="email" label="Email address" type="email" value={email} onChange={setEmail} autoComplete="email" />
      <button type="submit" disabled={submitting} className="border rounded px-3 py-1">
        {submitting ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
