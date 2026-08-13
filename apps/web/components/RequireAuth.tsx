"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "../lib/api";
import type { UserProfile } from "../lib/types";
import { FormErrors } from "./FormErrors";

export function RequireAuth({ children }: { children: (profile: UserProfile) => React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiFetch<UserProfile>("/users/me")
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) {
          router.push(`/login?returnTo=${encodeURIComponent(pathname)}`);
        } else if (error instanceof ApiError) {
          setMessage(error.message);
        } else {
          setMessage("Something went wrong");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  if (loading) return <p>Loading…</p>;
  if (message) return <FormErrors message={message} />;
  if (!profile) return null;
  return <>{children(profile)}</>;
}
