import request from "supertest";
import { createTestApp, TestApp } from "./setup";
import { createUser } from "./factories";

describe("session cookie security attributes", () => {
  let app: TestApp;

  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(() => app.close());

  beforeEach(async () => {
    await app.prisma.user.deleteMany();
    await createUser(app.prisma, { email: "sam@example.com", password: "Password123!" });
  });

  // The controller reads the environment per request, so a value left behind
  // here would change how every later case in this file behaves.
  afterEach(() => {
    delete process.env.CROSS_SITE_COOKIES;
    delete process.env.SECURE_COOKIES;
  });

  async function loginCookies(): Promise<string[]> {
    const res = await request(app.server)
      .post("/auth/login")
      .send({ email: "sam@example.com", password: "Password123!" })
      .expect(200);
    return (res.get("set-cookie") ?? []) as unknown as string[];
  }

  it("marks the cookies SameSite=None and Secure when the web app is on another site", async () => {
    process.env.CROSS_SITE_COOKIES = "true";

    const cookies = await loginCookies();

    expect(cookies).toHaveLength(2);
    for (const cookie of cookies) {
      expect(cookie).toMatch(/SameSite=None/i);
      expect(cookie).toMatch(/;\s*Secure/i);
    }
  });

  it("marks the signed-out cart's cookie the same way, so the cart survives the trip", async () => {
    process.env.CROSS_SITE_COOKIES = "true";
    const product = await app.prisma.product.create({
      data: {
        id: "prd_cookie_case",
        slug: "cookie-case",
        name: "Cookie case",
        description: "A case for cookies",
        priceCents: 500,
        imageUrl: "/product-image/cookie-case",
        stock: 3,
      },
    });

    const res = await request(app.server)
      .post("/cart/items")
      .send({ productId: product.id, quantity: 1 })
      .expect(200);

    const cookies = (res.get("set-cookie") ?? []) as unknown as string[];
    const cartCookie = cookies.find((cookie) => cookie.startsWith("cart_token="));
    // Without this the browser holds the cart's token and never sends it
    // back, so every request looks like a brand new visitor with no cart.
    expect(cartCookie).toMatch(/SameSite=None/i);
    expect(cartCookie).toMatch(/;\s*Secure/i);
  });

  it("marks the cookies SameSite=Lax and Secure when the API is proxied under the web app's origin", async () => {
    // The deployed shape: school-web proxies /api/* here, so the browser sees
    // one origin and the cookies are first-party. Lax is then correct, and
    // Secure is required because a browser will not store a cookie without it
    // from an HTTPS page. Crucially this is *not* SameSite=None: a
    // third-party cookie is one Safari, iOS, Brave and a Chrome profile with
    // third-party cookies blocked would each be free to drop.
    process.env.SECURE_COOKIES = "true";

    const cookies = await loginCookies();

    expect(cookies).toHaveLength(2);
    for (const cookie of cookies) {
      expect(cookie).toMatch(/SameSite=Lax/i);
      expect(cookie).toMatch(/;\s*Secure/i);
    }
  });

  it("keeps the cookies SameSite=Lax and insecure for same-site local development", async () => {
    const cookies = await loginCookies();

    expect(cookies).toHaveLength(2);
    for (const cookie of cookies) {
      expect(cookie).toMatch(/SameSite=Lax/i);
      expect(cookie).not.toMatch(/;\s*Secure/i);
    }
  });

  it("clears the cookies with the same attributes it set them with", async () => {
    process.env.CROSS_SITE_COOKIES = "true";
    const cookies = await loginCookies();

    const res = await request(app.server).post("/auth/logout").set("Cookie", cookies).expect(204);

    const cleared = (res.get("set-cookie") ?? []) as unknown as string[];
    expect(cleared).toHaveLength(2);
    for (const cookie of cleared) {
      // A browser only replaces a cookie when the attributes match the ones it
      // was stored with, so a Lax clear-cookie would leave a None cookie in
      // place and the session would survive signing out.
      expect(cookie).toMatch(/SameSite=None/i);
      expect(cookie).toMatch(/;\s*Secure/i);
    }
  });
});
