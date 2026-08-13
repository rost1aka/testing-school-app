export default function HomePage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-text">School App</h1>
      <ul className="space-y-2 text-sm">
        <li><a href="/login" className="text-accent hover:text-accent-hover hover:underline">Login</a></li>
        <li><a href="/register" className="text-accent hover:text-accent-hover hover:underline">Register</a></li>
        <li><a href="/profile" className="text-accent hover:text-accent-hover hover:underline">Profile</a></li>
        <li><a href="/addresses" className="text-accent hover:text-accent-hover hover:underline">Addresses</a></li>
      </ul>
    </main>
  );
}
