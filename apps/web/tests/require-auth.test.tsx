import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RequireAuth } from "../components/RequireAuth";
import type { UserProfile } from "../lib/types";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/profile",
}));

beforeEach(() => {
  push.mockClear();
  vi.unstubAllGlobals();
});

function jsonResponse(status: number, body: unknown) {
  return { ok: status < 400, status, json: async () => body } as Response;
}

const profile: UserProfile = {
  id: "usr_1",
  email: "sam@example.com",
  name: "Sam Sample",
  phone: null,
  role: "USER",
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("RequireAuth", () => {
  it("renders Loading… before the request settles", () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise<Response>(() => {})));
    render(<RequireAuth>{() => <p>Secret</p>}</RequireAuth>);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("renders the child with the fetched profile", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, profile)));
    render(<RequireAuth>{(p) => <p>{p.name}</p>}</RequireAuth>);
    expect(await screen.findByText("Sam Sample")).toBeInTheDocument();
  });

  it("calls push with a login path on a 401", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      jsonResponse(401, { code: "UNAUTHENTICATED", message: "Sign in required", fieldErrors: null }),
    ));
    render(<RequireAuth>{() => <p>Secret</p>}</RequireAuth>);
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(push.mock.calls[0][0]).toMatch(/^\/login/);
  });

  it("does not render the child after a 401", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      jsonResponse(401, { code: "UNAUTHENTICATED", message: "Sign in required", fieldErrors: null }),
    ));
    render(<RequireAuth>{() => <p>Secret</p>}</RequireAuth>);
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
  });
});
