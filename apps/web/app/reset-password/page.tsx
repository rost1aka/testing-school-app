import { Suspense } from "react";
import { ResetPasswordForm } from "../../components/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Reset password</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
