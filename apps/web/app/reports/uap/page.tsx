"use client";

import { UAP_OPTION_LABELS } from "@school/shared";
import { Suspense, useEffect, useState } from "react";
import { FormErrors } from "../../../components/FormErrors";
import { RequireAuth } from "../../../components/RequireAuth";
import { apiFetch, ApiError } from "../../../lib/api";
import type { UapReportSummary } from "../../../lib/types";

export default function UapReportsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-text">UAP reports</h1>
        <a
          href="/reports/uap/new"
          className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
        >
          File a report
        </a>
      </div>
      <Suspense fallback={<p className="text-sm text-text-muted">Loading…</p>}>
        <RequireAuth>{() => <UapReportList />}</RequireAuth>
      </Suspense>
    </main>
  );
}

function UapReportList() {
  const [reports, setReports] = useState<UapReportSummary[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<UapReportSummary[]>("/reports/uap")
      .then((data) => {
        if (!cancelled) setReports(data);
      })
      .catch((error) => {
        if (cancelled) return;
        setMessage(error instanceof ApiError ? error.message : "Something went wrong");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (message) return <FormErrors message={message} />;
  if (!reports) return <p className="text-sm text-text-muted">Loading…</p>;
  if (reports.length === 0) return <p className="text-sm text-text-muted">No reports on file.</p>;

  return (
    <ul className="space-y-3">
      {reports.map((report) => (
        <li
          key={report.id}
          className="rounded-card border border-border bg-surface p-4 shadow-card"
        >
          <a href={`/reports/uap/${report.id}`} className="text-sm font-medium text-accent">
            {report.caseNumber}
          </a>
          <p className="mt-1 text-sm text-text-muted">
            {UAP_OPTION_LABELS[report.objectShape] ?? report.objectShape} seen on{" "}
            {report.sightingDate} · Threat:{" "}
            {UAP_OPTION_LABELS[report.threatAssessment] ?? report.threatAssessment}
          </p>
        </li>
      ))}
    </ul>
  );
}
