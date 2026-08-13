"use client";

import { Suspense } from "react";
import { ProfileForm } from "../../components/ProfileForm";
import { RequireAuth } from "../../components/RequireAuth";

export default function ProfilePage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <RequireAuth>
          {(profile) => (
            <div>
              <p className="mb-4 text-sm text-gray-600">{profile.email}</p>
              <ProfileForm profile={profile} />
            </div>
          )}
        </RequireAuth>
      </Suspense>
    </main>
  );
}
