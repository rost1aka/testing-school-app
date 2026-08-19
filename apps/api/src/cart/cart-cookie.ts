import type { CookieOptions } from "express";
import { cookieSecurity } from "../common/config";

/** The cookie that tells a signed-out browser which cart is its own. */
export const CART_COOKIE = "cart_token";

// Read only by the API, so httpOnly; kept for a month, because a cart a
// visitor left behind is exactly what they come back for.
const BASE_CART_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  path: "/",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

/**
 * Built per request, for the same reason the session cookies are: where the
 * web app is served from another site — as it is once deployed — a
 * `SameSite=Lax` cookie is never sent with the web app's fetch, and a
 * signed-out visitor would find an empty cart on every request while the rows
 * sat in the database under a token their browser never returned.
 */
export function cartCookieOptions(): CookieOptions {
  return { ...BASE_CART_COOKIE_OPTIONS, ...cookieSecurity(process.env) };
}
