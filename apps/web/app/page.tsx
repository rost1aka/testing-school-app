export default function HomePage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">School App</h1>
      <ul className="mt-4 list-disc pl-6">
        <li><a href="/login">Login</a></li>
        <li><a href="/register">Register</a></li>
        <li><a href="/profile">Profile</a></li>
        <li><a href="/addresses">Addresses</a></li>
      </ul>
    </main>
  );
}
