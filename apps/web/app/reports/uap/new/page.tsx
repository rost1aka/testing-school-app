"use client";

import { Suspense } from "react";
import { RequireAuth } from "../../../../components/RequireAuth";
import { UapReportForm } from "../../../../components/uap/UapReportForm";

export default function NewUapReportPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
        Form FD-302-UAP
      </p>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-text">
        UAP incident report
      </h1>
      <p className="mb-6 text-sm text-text-muted">
        File this report after observing an unidentified aerial phenomenon. A filed
        report cannot be edited, so check it before you submit.
      </p>
      <Suspense fallback={<p className="text-sm text-text-muted">Loading…</p>}>
        <RequireAuth>{(profile) => <UapReportForm agentName={profile.name} />}</RequireAuth>
      </Suspense>
    </main>
  );
}
