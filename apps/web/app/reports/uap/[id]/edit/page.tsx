"use client";

import { toDraft } from "@school/shared";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { FormErrors } from "../../../../../components/FormErrors";
import { RequireAuth } from "../../../../../components/RequireAuth";
import { UapReportForm } from "../../../../../components/uap/UapReportForm";
import { apiFetch, ApiError } from "../../../../../lib/api";
import type { UapReport } from "../../../../../lib/types";

export default function EditUapReportPage() {
  const params = useParams<{ id: string }>();
  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <p className="mb-4 text-sm">
        <a href={`/reports/uap/${params.id}`} className="text-accent">
          &larr; Back to report
        </a>
      </p>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
        Form FD-302-UAP
      </p>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-text">Amend report</h1>
      <p className="mb-6 text-sm text-text-muted">
        An amendment has to satisfy every rule the first filing did, and the report
        records that it was amended.
      </p>
      <Suspense fallback={<p className="text-sm text-text-muted">Loading…</p>}>
        <RequireAuth>{() => <LoadedForm />}</RequireAuth>
      </Suspense>
    </main>
  );
}

function LoadedForm() {
  const params = useParams<{ id: string }>();
  const [report, setReport] = useState<UapReport | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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

  // Mounted only once the report has arrived, so the draft it starts from is
  // the filed one — no effect has to reach in and overwrite what is on screen.
  return <UapReportForm initialDraft={toDraft(report)} reportId={report.id} />;
}
