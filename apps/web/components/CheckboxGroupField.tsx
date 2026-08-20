"use client";

/**
 * A fieldset with a legend rather than a label: the group is what the question
 * belongs to, and the group's errors are described against the fieldset, not
 * against whichever box happens to be first.
 */
export function CheckboxGroupField({
  name, legend, values, onChange, options, optionLabels, errors, required,
}: {
  name: string;
  legend: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: readonly string[];
  optionLabels: Record<string, string>;
  errors?: string[];
  required?: boolean;
}) {
  const hasErrors = Boolean(errors?.length);

  function toggle(option: string, checked: boolean) {
    // Rebuilt from the option order rather than appended to, so the stored
    // list reads the same however it was clicked together.
    onChange(options.filter((o) => (o === option ? checked : values.includes(o))));
  }

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
              type="checkbox"
              value={option}
              checked={values.includes(option)}
              onChange={(event) => toggle(option, event.target.checked)}
              className={`h-4 w-4 rounded border ${hasErrors ? "border-danger" : "border-border"}`}
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
