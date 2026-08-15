import { RegisterForm } from "../../components/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-text">Create an account</h1>
      <RegisterForm />
    </main>
  );
}
