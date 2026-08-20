"use client";

import { borderFor, controlClassName, FieldShell } from "./FieldShell";

export function SelectField({
  id, label, value, onChange, options, optionLabels, errors, required, placeholder = "Select…",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  optionLabels: Record<string, string>;
  errors?: string[];
  required?: boolean;
  placeholder?: string;
}) {
  const hasErrors = Boolean(errors?.length);
  return (
    <FieldShell id={id} label={label} required={required} errors={errors}>
      <select
        id={id}
        name={id}
        value={value}
        aria-required={required || undefined}
        aria-invalid={hasErrors || undefined}
        aria-describedby={hasErrors ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={`${controlClassName} ${borderFor(hasErrors)}`}
      >
        {/* An empty first option rather than a preselected one: a select that
            starts on a real answer collects that answer from everyone who
            never looked at it. */}
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>{optionLabels[option] ?? option}</option>
        ))}
      </select>
    </FieldShell>
  );
}
