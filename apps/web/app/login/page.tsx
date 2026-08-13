import { Suspense } from "react";
import { LoginForm } from "../../components/LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-text">Sign in</h1>
      <Suspense fallback={<p className="text-sm text-text-muted">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
