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
        {!loading && (
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
