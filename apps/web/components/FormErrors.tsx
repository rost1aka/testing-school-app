export function FormErrors({ message }: { message: string | null }) {
  if (!message) return null;
  return <p role="alert" className="mb-4 text-sm text-red-700">{message}</p>;
}
