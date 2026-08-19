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
 * In production the web app and the API sit on different hosts under
 * `onrender.com`, which is on the Public Suffix List — so a browser treats
 * them as different *sites*, not sibling subdomains, and simply never sends a
 * `SameSite=Lax` cookie on the web app's fetch to the API. Sign-in would
 * appear to succeed and then silently do nothing. `SameSite=None` fixes that,
 * and browsers reject it unless `Secure` is set too, so the two travel
 * together.
 *
 * Locally both apps are on `localhost` over plain HTTP, where `Secure` would
 * make the browser drop the cookies instead. Hence the switch rather than a
 * constant.
 */
export function cookieSecurity(env: NodeJS.ProcessEnv): CookieSecurity {
  return env.CROSS_SITE_COOKIES === "true"
    ? { sameSite: "none", secure: true }
    : { sameSite: "lax", secure: false };
}
