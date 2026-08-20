"use client";

import { focusField } from "../FieldShell";

/**
 * The block at the top of a rejected form. It says how many fields need
 * attention and links to each of them, because on a form this long the
 * messages beside the fields can all be below the fold.
 */
export function ValidationSummary({
  fieldErrors, labels, order, lead = "This report was not filed.",
}: {
  fieldErrors: Record<string, string[]>;
  labels: Record<string, string>;
  order: readonly string[];
  lead?: string;
}) {
  const invalid = order.filter((field) => fieldErrors[field]?.length);
  if (invalid.length === 0) return null;

  return (
    <div
      id="validation-summary"
      role="alert"
      tabIndex={-1}
      className="mb-6 rounded-md border border-danger/30 bg-danger/10 px-4 py-3"
    >
      <p className="text-sm font-medium text-danger">
        {lead}{" "}
        {invalid.length === 1 ? "1 field needs" : `${invalid.length} fields need`} your attention.
      </p>
      <ul className="mt-2 space-y-1 text-sm text-danger">
        {invalid.map((field) => (
          <li key={field}>
            <a
              href={`#${field}`}
              className="underline"
              onClick={(event) => {
                event.preventDefault();
                focusField(field);
              }}
            >
              {labels[field] ?? field}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
