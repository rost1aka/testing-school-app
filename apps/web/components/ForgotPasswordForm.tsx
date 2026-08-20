"use client";

import { useState } from "react";
import { apiFetch, ApiError } from "../lib/api";
import type { FieldErrors } from "../lib/types";
import { Field } from "./Field";
import { FormErrors } from "./FormErrors";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setFieldErrors({});
    try {
      await apiFetch("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
      setSubmitted(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 400 && error.fieldErrors) {
        // A 400 with fieldErrors is a verdict on the shape of the string
        // that was typed, not on whether any account matches it, so showing
        // it tells the visitor nothing about who is registered.
        setMessage(error.message);
        setFieldErrors(error.fieldErrors);
      } else if (error instanceof ApiError) {
        // Every other answer from the server produces the same confirmation,
        // so a registered address and an unregistered one are indistinguishable.
        setSubmitted(true);
      } else {
        setMessage("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return <p className="text-sm text-text">If that address is registered, a reset link is on its way.</p>;
  }

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-card border border-border bg-surface p-4 shadow-card">
      <FormErrors message={message} />
      <Field
        id="email"
        label="Email address"
        type="email"
        value={email}
        onChange={setEmail}
        errors={fieldErrors.email}
        autoComplete="email"
      />
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
