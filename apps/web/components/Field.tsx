"use client";

export function Field({
  id, label, type = "text", value, onChange, errors, autoComplete, placeholder,
}: {
  id: string; label: string; type?: string; value: string;
  onChange: (value: string) => void; errors?: string[]; autoComplete?: string; placeholder?: string;
}) {
  const hasErrors = Boolean(errors?.length);
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-text">{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={hasErrors || undefined}
        aria-describedby={hasErrors ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-md border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted ${
          hasErrors ? "border-danger" : "border-border"
        }`}
      />
      {hasErrors && (
        <ul id={`${id}-error`} className="mt-1 space-y-0.5 text-sm text-danger">
          {errors!.map((error) => <li key={error}>{error}</li>)}
        </ul>
      )}
    </div>
  );
}
