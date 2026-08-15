import { ForgotPasswordForm } from "../../components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-text">Forgot password</h1>
      <ForgotPasswordForm />
    </main>
  );
}
