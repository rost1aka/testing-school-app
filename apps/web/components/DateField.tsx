"use client";

import { borderFor, controlClassName, FieldShell } from "./FieldShell";

export function DateField({
  id, label, value, onChange, errors, required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  errors?: string[];
  required?: boolean;
}) {
  const hasErrors = Boolean(errors?.length);
  return (
    <FieldShell id={id} label={label} required={required} errors={errors}>
      <input
        id={id}
        name={id}
        type="date"
        value={value}
        aria-required={required || undefined}
        aria-invalid={hasErrors || undefined}
        aria-describedby={hasErrors ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={`${controlClassName} ${borderFor(hasErrors)}`}
      />
    </FieldShell>
  );
}
