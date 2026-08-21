"use client";

import { Suspense } from "react";
import { AddressesPanel } from "../../components/AddressesPanel";
import { ProfileForm } from "../../components/ProfileForm";
import { RequireAuth } from "../../components/RequireAuth";

export default function ProfilePage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-text">Profile</h1>
      <Suspense fallback={<p className="text-sm text-text-muted">Loading…</p>}>
        <RequireAuth>
          {(profile) => (
            <div>
              <p className="mb-4 text-sm text-text-muted">{profile.email}</p>
              <ProfileForm profile={profile} />
              <section className="mt-10">
                <h2 className="mb-4 text-xl font-semibold tracking-tight text-text">Addresses</h2>
                <AddressesPanel />
              </section>
            </div>
          )}
        </RequireAuth>
      </Suspense>
    </main>
  );
}
