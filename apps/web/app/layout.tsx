import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "School App",
};

const navLinks = [
  { href: "/login", label: "Login" },
  { href: "/register", label: "Register" },
  { href: "/profile", label: "Profile" },
  { href: "/addresses", label: "Addresses" },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-border bg-surface">
            <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
              <a href="/" className="text-sm font-semibold tracking-tight text-text">
                School App
              </a>
              <nav className="flex items-center gap-4 text-sm text-text-muted">
                {navLinks.map((link) => (
                  <a key={link.href} href={link.href} className="hover:text-accent">
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>
          </header>
          <div className="flex-1">{children}</div>
        </div>
      </body>
    </html>
  );
}
