"use client";

import { UAP_FIELD_NAMES, UAP_LABELS, UAP_OPTION_LABELS } from "@school/shared";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { FormErrors } from "../../../../components/FormErrors";
import { RequireAuth } from "../../../../components/RequireAuth";
import { apiFetch, ApiError } from "../../../../lib/api";
import type { UapReport } from "../../../../lib/types";

/** The fields whose stored value is an option code rather than prose. */
const CHOICE_FIELDS = new Set([
  "fieldOffice",
  "objectShape",
  "objectCount",
  "observationDuration",
  "estimatedAltitude",
  "debrisStorageLocation",
  "encounterClass",
  "medicalEvaluation",
  "threatAssessment",
  "classificationLevel",
]);

export default function UapReportPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Suspense fallback={<p className="text-sm text-text-muted">Loading…</p>}>
        <RequireAuth>{() => <FiledReport />}</RequireAuth>
      </Suspense>
    </main>
  );
}

function FiledReport() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const justFiled = searchParams.get("filed") === "1";
  const justSaved = searchParams.get("saved") === "1";
  const [report, setReport] = useState<UapReport | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  // Deleting is irreversible and there is no undo, so the button asks first
  // rather than acting on one click.
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function onDelete() {
    setDeleting(true);
    setMessage(null);
    try {
      await apiFetch(`/reports/uap/${params.id}`, { method: "DELETE" });
      router.push("/reports/uap");
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Something went wrong");
      setDeleting(false);
      setConfirming(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    apiFetch<UapReport>(`/reports/uap/${params.id}`)
      .then((data) => {
        if (!cancelled) setReport(data);
      })
      .catch((error) => {
        if (cancelled) return;
        setMessage(error instanceof ApiError ? error.message : "Something went wrong");
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (message) return <FormErrors message={message} />;
  if (!report) return <p className="text-sm text-text-muted">Loading…</p>;

  const values = report as unknown as Record<string, unknown>;

  return (
    <>
      <p className="mb-4 text-sm">
        <a href="/reports/uap" className="text-accent">&larr; All reports</a>
      </p>
      {(justFiled || justSaved) && (
        <p
          role="status"
          className="mb-6 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
        >
          Report {report.caseNumber} has been {justSaved ? "amended" : "filed"}.
        </p>
      )}
      <FormErrors message={message} />
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
        Form FD-302-UAP
      </p>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-text">{report.caseNumber}</h1>
      <p className="mb-4 text-sm text-text-muted">
        Filed {report.createdAt.slice(0, 10)}
        {report.amendedAt && ` · amended ${report.amendedAt.slice(0, 10)}`}
      </p>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <a
          href={`/reports/uap/${report.id}/edit`}
          className="inline-flex items-center justify-center rounded-md border border-border px-3 py-1.5 text-sm font-medium text-text transition-colors hover:text-accent"
        >
          Edit
        </a>
        {confirming ? (
          <>
            <span className="text-sm text-text">Delete this report permanently?</span>
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="inline-flex items-center justify-center rounded-md bg-danger px-3 py-1.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Yes, delete"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className="inline-flex items-center justify-center rounded-md border border-border px-3 py-1.5 text-sm font-medium text-text transition-colors hover:text-accent"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="inline-flex items-center justify-center rounded-md border border-danger px-3 py-1.5 text-sm font-medium text-danger transition-colors"
          >
            Delete
          </button>
        )}
      </div>

      <dl className="divide-y divide-border rounded-card border border-border bg-surface shadow-card">
        {UAP_FIELD_NAMES.map((field) => {
          const rendered = present(field, values[field]);
          if (rendered === null) return null;
          return (
            <div key={field} className="grid gap-1 px-4 py-3 sm:grid-cols-3">
              <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
                {UAP_LABELS[field]}
              </dt>
              <dd className="whitespace-pre-wrap text-sm text-text sm:col-span-2">{rendered}</dd>
            </div>
          );
        })}
      </dl>
    </>
  );
}

/**
 * What to show for one field, or null to leave it out entirely: a conditional
 * field that did not apply is absent from the report rather than shown blank.
 */
function present(field: string, value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    return value.map((item) => UAP_OPTION_LABELS[String(item)] ?? String(item)).join(", ");
  }
  if (typeof value === "number") return String(value);
  const text = String(value);
  return CHOICE_FIELDS.has(field) ? (UAP_OPTION_LABELS[text] ?? text) : text;
}
