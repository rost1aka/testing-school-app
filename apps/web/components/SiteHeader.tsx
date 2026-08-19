"use client";

import { useRouter } from "next/navigation";
import { useSession } from "../lib/session";

export function SiteHeader() {
  const router = useRouter();
  const { profile, loading, signOut } = useSession();

  async function onSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <a href="/" className="text-sm font-semibold tracking-tight text-text">
          School App
        </a>
        {loading ? (
          // Placeholders rather than nothing: the session request can take up
          // to a minute against a sleeping API, and an empty header for that
          // long reads as a finished page. Sized like the links they stand in
          // for, so the header does not jump when the real nav arrives.
          <div
            data-testid="nav-skeleton"
            aria-hidden="true"
            className="flex items-center gap-4 py-1.5"
          >
            <span className="h-4 w-10 animate-pulse rounded bg-surface-muted motion-reduce:animate-none" />
            <span className="h-4 w-16 animate-pulse rounded bg-surface-muted motion-reduce:animate-none" />
          </div>
        ) : (
          <nav className="flex items-center gap-4 text-sm text-text-muted">
            {profile ? (
              <>
                <a href="/profile" className="hover:text-accent">
                  Profile
                </a>
                <a href="/addresses" className="hover:text-accent">
                  Addresses
                </a>
                <span className="text-text">{profile.name}</span>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="inline-flex items-center justify-center rounded-md border border-border px-3 py-1.5 text-sm font-medium text-text transition-colors hover:text-accent"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <a href="/login" className="hover:text-accent">
                  Login
                </a>
                <a href="/register" className="hover:text-accent">
                  Register
                </a>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
