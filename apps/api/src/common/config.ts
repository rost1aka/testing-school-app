import type { CookieOptions } from "express";

const DEFAULT_PORT = 4000;

/**
 * The port the HTTP server should listen on.
 *
 * Platforms that run the app for us — Render, and every other PaaS — pick the
 * port themselves, pass it in `PORT`, and kill any process that does not
 * accept connections there. Locally nothing sets it, and 4000 is the port the
 * README, the web app's default `NEXT_PUBLIC_API_URL` and CI all expect.
 */
export function resolvePort(env: NodeJS.ProcessEnv): number {
  const assigned = Number(env.PORT);
  return Number.isInteger(assigned) && assigned > 0 ? assigned : DEFAULT_PORT;
}

export type CookieSecurity = Pick<CookieOptions, "sameSite" | "secure"> & {
  sameSite: "lax" | "none";
  secure: boolean;
};

/**
 * The `SameSite` and `Secure` attributes to put on the session cookies.
 *
 * Three deployments, two independent questions.
 *
 * `CROSS_SITE_COOKIES` answers "does the browser see the API as a different
 * *site* than the web app?". It does when the two are served from separate
 * hosts under `onrender.com`, which is on the Public Suffix List — so they
 * are different sites, not sibling subdomains, and a `SameSite=Lax` cookie is
 * never sent on the web app's fetch to the API. `SameSite=None` is the only
 * thing that works there, and browsers reject it without `Secure`.
 *
 * But `SameSite=None` makes these *third-party* cookies, and a browser is
 * free to refuse them: Safari and every iOS browser do by default, so do
 * Brave and Chrome once third-party cookies are blocked for that profile.
 * Sign-in then succeeds and leaves the user signed out, on that one machine
 * only. The deployment avoids the whole class of problem by proxying the API
 * under the web app's own origin (`/api/*` — see `apps/web/next.config.ts`),
 * which makes the cookies first-party again and `SameSite=Lax` correct.
 *
 * `SECURE_COOKIES` answers the second question — "is this served over
 * HTTPS?" — which the first no longer implies once the API is proxied. It is
 * separate because the proxied deployment needs `Secure` *with* `Lax`, and
 * local development needs neither: both apps are on `localhost` over plain
 * HTTP, where `Secure` would make the browser drop the cookies instead.
 */
export function cookieSecurity(env: NodeJS.ProcessEnv): CookieSecurity {
  const sameSite = env.CROSS_SITE_COOKIES === "true" ? "none" : "lax";
  // `SameSite=None` is rejected outright without `Secure`, so it implies it.
  const secure = sameSite === "none" || env.SECURE_COOKIES === "true";
  return { sameSite, secure };
}
