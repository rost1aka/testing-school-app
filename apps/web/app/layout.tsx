import type { ReactNode } from "react";
import { SiteHeader } from "../components/SiteHeader";
import { CartProvider } from "../lib/cart";
import { SessionProvider } from "../lib/session";
import "./globals.css";

export const metadata = {
  title: "School App",
};

/**
 * Applies a stored theme before the first paint. It has to be an inline script
 * in the document rather than an effect: an effect runs after React has
 * hydrated, by which point the reader has already seen a frame of the other
 * theme. Nothing is stored until someone uses the toggle, and with nothing
 * stored the stylesheet follows the operating system on its own.
 */
const applyStoredTheme = `try{var t=localStorage.getItem("theme");if(t==="dark"||t==="light"){document.documentElement.dataset.theme=t}}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The script writes an attribute the server did not render, which is the
    // point of it; React is told not to treat that as a hydration mismatch.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: applyStoredTheme }} />
      </head>
      <body>
        <SessionProvider>
          <CartProvider>
            <div className="flex min-h-screen flex-col">
              <SiteHeader />
              <div className="flex-1">{children}</div>
            </div>
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
