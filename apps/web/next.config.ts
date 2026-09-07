import type { NextConfig } from "next";

interface Rewrite {
  source: string;
  destination: string;
}

/**
 * Serves the API under the web app's own origin, so the session cookies are
 * first-party.
 *
 * Deployed, the two services are separate hosts under `onrender.com`, which
 * is on the Public Suffix List — different *sites* to a browser. Cookies set
 * by the API are then third-party, and a browser is free to drop them:
 * Safari and every iOS browser do by default, so do Brave and any Chrome
 * profile with third-party cookies blocked. Sign-in appears to work and
 * leaves the user signed out, on some machines and not others, which is
 * indistinguishable from a bug in the app.
 *
 * Proxying `/api/*` through this server removes the question. The browser
 * only ever talks to the web app's origin, `Set-Cookie` comes back on that
 * origin, and no privacy setting anywhere applies. `NEXT_PUBLIC_API_URL` is
 * then the relative `/api`, and `API_ORIGIN` — read here, on the server, not
 * inlined into the bundle — says where to forward.
 *
 * Locally there is nothing to solve: both apps are on `localhost`, which is
 * one site, so the browser calls the API directly and no rewrite is added.
 */
export async function apiRewrites(env: NodeJS.ProcessEnv = process.env): Promise<Rewrite[]> {
  const origin = env.API_ORIGIN?.replace(/\/+$/, "");

  if (!origin) {
    // A relative API URL with nothing to proxy it to would make every request
    // 404 against this server, with nothing in the browser to explain why.
    // Fail the build instead.
    if (env.NEXT_PUBLIC_API_URL?.startsWith("/")) {
      throw new Error(
        `NEXT_PUBLIC_API_URL is "${env.NEXT_PUBLIC_API_URL}", which this server has to proxy, but API_ORIGIN is not set. ` +
          "Set API_ORIGIN to the API's URL (https://school-api.onrender.com), or point NEXT_PUBLIC_API_URL straight at the API.",
      );
    }
    return [];
  }

  return [{ source: "/api/:path*", destination: `${origin}/:path*` }];
}

const nextConfig: NextConfig = {
  rewrites: () => apiRewrites(),
};

export default nextConfig;
