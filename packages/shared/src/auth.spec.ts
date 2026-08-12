import { registerSchema } from "./auth";

describe("registerSchema", () => {
  const valid = { email: "a@b.com", password: "Password123!", name: "Ada" };

  it("accepts a compliant registration", () => {
    expect(registerSchema.parse(valid)).toEqual(valid);
  });

  it.each([
    ["Short1!", "shorter than 10 characters"],
    ["alllowercase1", "no uppercase letter"],
    ["ALLUPPERCASE1", "no lowercase letter"],
    ["NoDigitsHere!", "no digit"],
  ])("rejects %s (%s)", (password) => {
    const result = registerSchema.safeParse({ ...valid, password });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed email", () => {
    expect(registerSchema.safeParse({ ...valid, email: "nope" }).success).toBe(false);
  });
});
