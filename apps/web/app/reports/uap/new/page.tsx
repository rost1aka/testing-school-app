"use client";

import { Suspense } from "react";
import { emptyUapReportDraft } from "@school/shared";
import { RequireAuth } from "../../../../components/RequireAuth";
import { UapReportForm } from "../../../../components/uap/UapReportForm";

export default function NewUapReportPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <p className="mb-4 text-sm">
        <a href="/reports/uap" className="text-accent">&larr; All reports</a>
      </p>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
        Form FD-302-UAP
      </p>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-text">
        UAP incident report
      </h1>
      <p className="mb-6 text-sm text-text-muted">
        File this report after observing an unidentified aerial phenomenon. It can
        be amended afterwards, and the report will record that it was.
      </p>
      <Suspense fallback={<p className="text-sm text-text-muted">Loading…</p>}>
        <RequireAuth>
          {(profile) => (
            // The reporting agent starts as the signed-in user, and stays
            // editable for a report filed on someone else's behalf.
            <UapReportForm
              initialDraft={{ ...emptyUapReportDraft, reportingAgentName: profile.name }}
            />
          )}
        </RequireAuth>
      </Suspense>
    </main>
  );
}
