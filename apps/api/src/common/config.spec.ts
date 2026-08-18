import { cookieSecurity, resolvePort } from "./config";

describe("resolvePort", () => {
  it("uses the port the platform assigns", () => {
    expect(resolvePort({ PORT: "10000" })).toBe(10000);
  });

  it("falls back to 4000 when no port is assigned", () => {
    expect(resolvePort({})).toBe(4000);
  });

  it("falls back to 4000 when the assigned port is not a number", () => {
    expect(resolvePort({ PORT: "not-a-port" })).toBe(4000);
  });
});

describe("cookieSecurity", () => {
  it("requires SameSite=None and Secure when the web app is on another site", () => {
    expect(cookieSecurity({ CROSS_SITE_COOKIES: "true" })).toEqual({
      sameSite: "none",
      secure: true,
    });
  });

  it("keeps same-site, insecure cookies for local development over plain HTTP", () => {
    expect(cookieSecurity({})).toEqual({ sameSite: "lax", secure: false });
  });
});
