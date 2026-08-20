"use client";

export function CheckboxField({
  id, label, checked, onChange, errors, description,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  errors?: string[];
  description?: string;
}) {
  const hasErrors = Boolean(errors?.length);
  const describedBy = [hasErrors ? `${id}-error` : null, description ? `${id}-description` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="mb-4">
      <div className="flex items-start gap-2">
        <input
          id={id}
          name={id}
          type="checkbox"
          checked={checked}
          aria-invalid={hasErrors || undefined}
          aria-describedby={describedBy || undefined}
          onChange={(event) => onChange(event.target.checked)}
          className={`mt-0.5 h-4 w-4 rounded border ${hasErrors ? "border-danger" : "border-border"}`}
        />
        <label htmlFor={id} className="text-sm text-text">{label}</label>
      </div>
      {description && (
        <p id={`${id}-description`} className="ml-6 mt-1 text-xs text-text-muted">{description}</p>
      )}
      {hasErrors && (
        <ul id={`${id}-error`} className="ml-6 mt-1 space-y-0.5 text-sm text-danger">
          {errors!.map((error) => <li key={error}>{error}</li>)}
        </ul>
      )}
    </div>
  );
}
