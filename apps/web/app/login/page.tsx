import { Suspense } from "react";
import { LoginForm } from "../../components/LoginForm";

export default function LoginPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Sign in</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
