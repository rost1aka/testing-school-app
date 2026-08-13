"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { apiFetch, ApiError } from "../lib/api";
import type { FieldErrors } from "../lib/types";
import { Field } from "./Field";
import { FormErrors } from "./FormErrors";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
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
      await apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      router.push(searchParams.get("returnTo") ?? "/");
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
      <Field id="email" label="Email address" type="email" value={email} onChange={setEmail} errors={fieldErrors.email} autoComplete="email" />
      <Field id="password" label="Password" type="password" value={password} onChange={setPassword} errors={fieldErrors.password} autoComplete="current-password" />
      <button type="submit" disabled={submitting} className="border rounded px-3 py-1">
        {submitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
