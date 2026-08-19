import type { CookieOptions } from "express";

/** The cookie that tells a signed-out browser which cart is its own. */
export const CART_COOKIE = "cart_token";

// Read only by the API, so httpOnly; kept for a month, because a cart a
// visitor left behind is exactly what they come back for.
export const CART_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secure: false,
  maxAge: 30 * 24 * 60 * 60 * 1000,
};
