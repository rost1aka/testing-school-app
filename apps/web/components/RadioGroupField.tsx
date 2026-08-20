"use client";

export function RadioGroupField({
  name, legend, value, onChange, options, optionLabels, errors, required,
}: {
  name: string;
  legend: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  optionLabels: Record<string, string>;
  errors?: string[];
  required?: boolean;
}) {
  const hasErrors = Boolean(errors?.length);
  return (
    <fieldset
      id={name}
      aria-invalid={hasErrors || undefined}
      aria-describedby={hasErrors ? `${name}-error` : undefined}
      className="mb-4"
    >
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <legend className="text-sm font-medium text-text">{legend}</legend>
        {required && <span className="text-xs text-text-muted">Required</span>}
      </div>
      <div className="space-y-1.5">
        {options.map((option) => (
          <div key={option} className="flex items-center gap-2">
            <input
              id={`${name}-${option}`}
              name={name}
              type="radio"
              value={option}
              checked={value === option}
              aria-required={required || undefined}
              onChange={() => onChange(option)}
              className={`h-4 w-4 border ${hasErrors ? "border-danger" : "border-border"}`}
            />
            <label htmlFor={`${name}-${option}`} className="text-sm text-text">
              {optionLabels[option] ?? option}
            </label>
          </div>
        ))}
      </div>
      {hasErrors && (
        <ul id={`${name}-error`} className="mt-1 space-y-0.5 text-sm text-danger">
          {errors!.map((error) => <li key={error}>{error}</li>)}
        </ul>
      )}
    </fieldset>
  );
}
