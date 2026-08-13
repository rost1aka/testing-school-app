import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterForm } from "../components/RegisterForm";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

beforeEach(() => {
  push.mockClear();
  vi.unstubAllGlobals();
});

function jsonResponse(status: number, body: unknown) {
  return { ok: status < 400, status, json: async () => body } as Response;
}

describe("RegisterForm", () => {
  it("labels all three inputs", () => {
    render(<RegisterForm />);
    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("registers and navigates home", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(201, { id: "usr_1" })));
    render(<RegisterForm />);
    await userEvent.type(screen.getByLabelText("Email address"), "sam@example.com");
    await userEvent.type(screen.getByLabelText("Name"), "Sam Student");
    await userEvent.type(screen.getByLabelText("Password"), "Password123!");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
  });

  it("renders every password error the API reports", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      jsonResponse(400, {
        code: "VALIDATION_FAILED",
        message: "Check the highlighted fields",
        fieldErrors: { password: ["Must be at least 8 characters", "Must contain a number"] },
      }),
    ));
    render(<RegisterForm />);
    await userEvent.type(screen.getByLabelText("Email address"), "sam@example.com");
    await userEvent.type(screen.getByLabelText("Name"), "Sam Student");
    await userEvent.type(screen.getByLabelText("Password"), "password");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText("Must be at least 8 characters")).toBeInTheDocument();
    expect(screen.getByText("Must contain a number")).toBeInTheDocument();
  });

  it("disables the button while the request is in flight", async () => {
    let release: (value: Response) => void = () => {};
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise<Response>((resolve) => { release = resolve; })));
    render(<RegisterForm />);
    await userEvent.type(screen.getByLabelText("Email address"), "sam@example.com");
    await userEvent.type(screen.getByLabelText("Name"), "Sam Student");
    await userEvent.type(screen.getByLabelText("Password"), "Password123!");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(screen.getByRole("button", { name: "Creating account…" })).toBeDisabled();
    release(jsonResponse(201, { id: "usr_1" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
  });
});
