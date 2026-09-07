import { describe, expect, it } from "vitest";
import { apiRewrites } from "../next.config";

describe("apiRewrites", () => {
  it("proxies /api/* to the API service when an origin is configured", async () => {
    expect(await apiRewrites({ API_ORIGIN: "https://school-api.onrender.com", NEXT_PUBLIC_API_URL: "/api" })).toEqual([
      { source: "/api/:path*", destination: "https://school-api.onrender.com/:path*" },
    ]);
  });

  it("strips a trailing slash from the origin rather than doubling it", async () => {
    expect(await apiRewrites({ API_ORIGIN: "https://school-api.onrender.com/", NEXT_PUBLIC_API_URL: "/api" })).toEqual([
      { source: "/api/:path*", destination: "https://school-api.onrender.com/:path*" },
    ]);
  });

  it("adds no rewrite for local development, where the browser calls the API directly", async () => {
    expect(await apiRewrites({ NEXT_PUBLIC_API_URL: "http://localhost:4000" })).toEqual([]);
    expect(await apiRewrites({})).toEqual([]);
  });

  it("refuses to build a relative API URL with no origin to proxy it to", async () => {
    await expect(apiRewrites({ NEXT_PUBLIC_API_URL: "/api" })).rejects.toThrow(/API_ORIGIN/);
  });
});
