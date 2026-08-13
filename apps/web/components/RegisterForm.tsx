"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch, ApiError } from "../lib/api";
import type { FieldErrors } from "../lib/types";
import { Field } from "./Field";
import { FormErrors } from "./FormErrors";

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setFieldErrors({});
    try {
      await apiFetch("/auth/register", { method: "POST", body: JSON.stringify({ email, name, password }) });
      router.push("/");
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
    <form onSubmit={onSubmit} noValidate className="rounded-card border border-border bg-surface p-4 shadow-card">
      <FormErrors message={message} />
      <Field id="email" label="Email address" type="email" value={email} onChange={setEmail} errors={fieldErrors.email} autoComplete="email" />
      <Field id="name" label="Name" value={name} onChange={setName} errors={fieldErrors.name} autoComplete="name" />
      <Field id="password" label="Password" type="password" value={password} onChange={setPassword} errors={fieldErrors.password} autoComplete="new-password" />
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
