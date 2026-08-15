"use client";

import { useSession } from "../lib/session";

export default function HomePage() {
  const { profile, loading } = useSession();

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      {loading ? (
        <h1 className="text-2xl font-semibold tracking-tight text-text">School App</h1>
      ) : profile ? (
        <>
          <h1 className="mb-6 text-2xl font-semibold tracking-tight text-text">
            Welcome back, {profile.name}
          </h1>
          <div className="flex flex-wrap gap-3">
            <a
              href="/profile"
              className="inline-flex items-center justify-center rounded-card border border-border bg-surface px-4 py-2 text-sm font-medium text-text shadow-card transition-colors hover:text-accent"
            >
              Your profile
            </a>
            <a
              href="/addresses"
              className="inline-flex items-center justify-center rounded-card border border-border bg-surface px-4 py-2 text-sm font-medium text-text shadow-card transition-colors hover:text-accent"
            >
              Your addresses
            </a>
          </div>
        </>
      ) : (
        <>
          <h1 className="mb-4 text-2xl font-semibold tracking-tight text-text">School App</h1>
          <p className="mb-6 text-sm text-text-muted">
            School App keeps your account, profile, and saved addresses in one place.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="/login"
              className="inline-flex items-center justify-center rounded-card bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Log in
            </a>
            <a
              href="/register"
              className="inline-flex items-center justify-center rounded-card border border-border bg-surface px-4 py-2 text-sm font-medium text-text shadow-card transition-colors hover:text-accent"
            >
              Create an account
            </a>
          </div>
        </>
      )}
    </main>
  );
}
