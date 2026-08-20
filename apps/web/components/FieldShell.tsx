"use client";

/**
 * The label, the required marker and the error list every single-control field
 * shares. The marker sits beside the label rather than inside it, so the
 * label's text stays exactly what it reads as — a field is still found by its
 * plain name, with or without the marker.
 */
export function FieldShell({
  id, label, required, errors, hint, children,
}: {
  id: string;
  label: string;
  required?: boolean;
  errors?: string[];
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  const hasErrors = Boolean(errors?.length);
  return (
    <div className="mb-4">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="block text-sm font-medium text-text">{label}</label>
        {required && <span className="text-xs text-text-muted">Required</span>}
      </div>
      {children}
      {hint}
      {hasErrors && (
        <ul id={`${id}-error`} className="mt-1 space-y-0.5 text-sm text-danger">
          {errors!.map((error) => <li key={error}>{error}</li>)}
        </ul>
      )}
    </div>
  );
}

export const controlClassName =
  "w-full rounded-md border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted";

export const borderFor = (hasErrors: boolean) => (hasErrors ? "border-danger" : "border-border");

/**
 * Moves focus to a field by name. Radio groups and checkbox groups have no
 * single element carrying the id, but every control in them carries the field
 * name, so that is what this looks for first.
 */
export function focusField(name: string) {
  const control =
    document.querySelector<HTMLElement>(`[name="${name}"]`) ?? document.getElementById(name);
  if (!control) return;
  control.focus();
  control.scrollIntoView({ block: "center", behavior: "smooth" });
}
