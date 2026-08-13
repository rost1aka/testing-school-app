import { describe, expect, it, vi, afterEach } from "vitest";
import { apiFetch, ApiError } from "../lib/api";

function mockResponse(status: number, body: unknown) {
  return { ok: status < 400, status, json: async () => body } as Response;
}

afterEach(() => vi.unstubAllGlobals());

describe("apiFetch", () => {
  it("sends credentials so the API's httpOnly cookies are included", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse(200, { id: "usr_1" }));
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/users/me");

    expect(fetchMock.mock.calls[0][1]).toMatchObject({ credentials: "include" });
  });

  it("returns the parsed body on success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse(200, { id: "usr_1" })));
    expect(await apiFetch<{ id: string }>("/users/me")).toEqual({ id: "usr_1" });
  });

  it("throws an ApiError carrying code, message and fieldErrors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      mockResponse(400, {
        code: "VALIDATION_FAILED",
        message: "Check the highlighted fields",
        fieldErrors: { password: ["Password must contain a digit"] },
      }),
    ));

    const error = await apiFetch("/auth/register", { method: "POST" }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.code).toBe("VALIDATION_FAILED");
    expect(error.fieldErrors).toEqual({ password: ["Password must contain a digit"] });
  });

  it("throws an ApiError with null fieldErrors when the body has none", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      mockResponse(401, { code: "INVALID_CREDENTIALS", message: "Email or password is incorrect", fieldErrors: null }),
    ));

    const error = await apiFetch("/auth/login", { method: "POST" }).catch((e) => e);

    expect(error.fieldErrors).toBeNull();
    expect(error.message).toBe("Email or password is incorrect");
  });

  it("returns undefined for a 204 with no body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true, status: 204,
      json: async () => { throw new SyntaxError("Unexpected end of JSON input"); },
    } as unknown as Response));

    await expect(apiFetch("/auth/logout", { method: "POST" })).resolves.toBeUndefined();
  });
});
