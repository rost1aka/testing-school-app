import type { ReactNode } from "react";
import { SiteHeader } from "../components/SiteHeader";
import { SessionProvider } from "../lib/session";
import "./globals.css";

export const metadata = {
  title: "School App",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <div className="flex-1">{children}</div>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
