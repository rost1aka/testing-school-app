"use client";

export function Field({
  id, label, type = "text", value, onChange, errors, autoComplete,
}: {
  id: string; label: string; type?: string; value: string;
  onChange: (value: string) => void; errors?: string[]; autoComplete?: string;
}) {
  const hasErrors = Boolean(errors?.length);
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium mb-1">{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        aria-invalid={hasErrors || undefined}
        aria-describedby={hasErrors ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border rounded px-2 py-1"
      />
      {hasErrors && (
        <ul id={`${id}-error`} className="mt-1 text-sm text-red-700">
          {errors!.map((error) => <li key={error}>{error}</li>)}
        </ul>
      )}
    </div>
  );
}
