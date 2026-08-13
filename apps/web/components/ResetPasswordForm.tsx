"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { apiFetch, ApiError } from "../lib/api";
import type { FieldErrors } from "../lib/types";
import { Field } from "./Field";
import { FormErrors } from "./FormErrors";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
      const token = searchParams.get("token");
      await apiFetch("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) });
      router.push("/login");
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
      <Field
        id="password"
        label="New password"
        type="password"
        value={password}
        onChange={setPassword}
        errors={fieldErrors.password}
        autoComplete="new-password"
      />
      <button type="submit" disabled={submitting} className="border rounded px-3 py-1">
        {submitting ? "Setting…" : "Set new password"}
      </button>
    </form>
  );
}
