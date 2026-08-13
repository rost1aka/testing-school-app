import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForgotPasswordForm } from "../components/ForgotPasswordForm";

beforeEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(status: number, body: unknown) {
  return { ok: status < 400, status, json: async () => body } as Response;
}

describe("ForgotPasswordForm", () => {
  it("labels the email input", () => {
    render(<ForgotPasswordForm />);
    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
  });

  it("posts the email and shows the confirmation regardless of whether the address exists", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(202, {}));
    vi.stubGlobal("fetch", fetchMock);
    render(<ForgotPasswordForm />);
    await userEvent.type(screen.getByLabelText("Email address"), "sam@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ email: "sam@example.com" });
    expect(
      await screen.findByText("If that address is registered, a reset link is on its way."),
    ).toBeInTheDocument();
  });

  it("disables the button while the request is in flight", async () => {
    let release: (value: Response) => void = () => {};
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise<Response>((resolve) => { release = resolve; })));
    render(<ForgotPasswordForm />);
    await userEvent.type(screen.getByLabelText("Email address"), "sam@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(screen.getByRole("button", { name: "Sending…" })).toBeDisabled();
    release(jsonResponse(202, {}));
    await waitFor(() =>
      expect(screen.getByText("If that address is registered, a reset link is on its way.")).toBeInTheDocument(),
    );
  });
});
