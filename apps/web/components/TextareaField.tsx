"use client";

import { borderFor, controlClassName, FieldShell } from "./FieldShell";

/**
 * The counter measures what the validator measures — the trimmed value, in
 * code points — so the number a person reads is the number the rule uses.
 *
 * There is deliberately no `maxLength`: going over the limit has to be
 * possible, or the error explaining the limit could never be seen.
 */
export function TextareaField({
  id, label, value, onChange, max, errors, required, rows = 4, placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  max: number;
  errors?: string[];
  required?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  const hasErrors = Boolean(errors?.length);
  const length = [...value.trim()].length;
  const over = length > max;
  const describedBy = [hasErrors ? `${id}-error` : null, `${id}-count`].filter(Boolean).join(" ");

  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      errors={errors}
      hint={
        <p
          id={`${id}-count`}
          className={`mt-1 text-xs tabular-nums ${over ? "text-danger" : "text-text-muted"}`}
        >
          {length} / {max}
        </p>
      }
    >
      <textarea
        id={id}
        name={id}
        value={value}
        rows={rows}
        placeholder={placeholder}
        aria-required={required || undefined}
        aria-invalid={hasErrors || undefined}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.value)}
        className={`${controlClassName} ${borderFor(hasErrors)}`}
      />
    </FieldShell>
  );
}
