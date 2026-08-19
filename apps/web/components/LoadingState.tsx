"use client";

import { useEffect, useState } from "react";

// Long enough that a warm API never shows the longer message — a local request
// settles in milliseconds — and short enough that a sleeping one explains
// itself well before the user gives up on the page.
const ESCALATE_AFTER_MS = 6000;

/**
 * The "we are waiting on the session" state.
 *
 * The wait it covers is not always short. On a free hosting tier the API sleeps
 * after fifteen minutes of inactivity, and the first request both wakes the
 * service and resumes the database's compute — up to a minute in total. A
 * static "Loading…" held for that long reads as a page that has finished
 * rendering and simply has nothing on it, so the message escalates to name the
 * cause instead of repeating itself.
 */
export function LoadingState({ escalateAfterMs = ESCALATE_AFTER_MS }: { escalateAfterMs?: number }) {
  const [waitingLonger, setWaitingLonger] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setWaitingLonger(true), escalateAfterMs);
    return () => clearTimeout(timer);
  }, [escalateAfterMs]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-start gap-3 text-sm text-text-muted"
    >
      <span
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-border border-t-accent motion-reduce:animate-none"
      />
      <p>
        {waitingLonger
          ? "Still waking up the server. The free tier sleeps when idle — this can take up to a minute."
          : "Loading…"}
      </p>
    </div>
  );
}
