import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddressForm } from "../components/AddressForm";
import type { Address } from "../lib/types";

beforeEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(status: number, body: unknown) {
  return { ok: status < 400, status, json: async () => body } as Response;
}

const created: Address = {
  id: "addr_1",
  label: "Home",
  line1: "12 Elm Street",
  city: "Springfield",
  postalCode: "62704",
  country: "US",
  isDefault: true,
};

async function fillForm() {
  await userEvent.type(screen.getByLabelText("Label"), "Home");
  await userEvent.type(screen.getByLabelText("Street address"), "12 Elm Street");
  await userEvent.type(screen.getByLabelText("City"), "Springfield");
  await userEvent.type(screen.getByLabelText("Postal code"), "62704");
  await userEvent.type(screen.getByLabelText("Country"), "US");
}

describe("AddressForm", () => {
  it("labels all five inputs", () => {
    render(<AddressForm onCreated={() => {}} />);
    expect(screen.getByLabelText("Label")).toBeInTheDocument();
    expect(screen.getByLabelText("Street address")).toBeInTheDocument();
    expect(screen.getByLabelText("City")).toBeInTheDocument();
    expect(screen.getByLabelText("Postal code")).toBeInTheDocument();
    expect(screen.getByLabelText("Country")).toBeInTheDocument();
  });

  it("POSTs /users/me/addresses with the filled-in values", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201, created));
    vi.stubGlobal("fetch", fetchMock);
    render(<AddressForm onCreated={() => {}} />);
    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "Save address" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/users/me/addresses");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      label: "Home",
      line1: "12 Elm Street",
      city: "Springfield",
      postalCode: "62704",
      country: "US",
    });
  });

  it("calls onCreated with the created address and clears the form", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(201, created)));
    const onCreated = vi.fn();
    render(<AddressForm onCreated={onCreated} />);
    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "Save address" }));
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(created));
    expect(screen.getByLabelText("Label")).toHaveValue("");
    expect(screen.getByLabelText("Street address")).toHaveValue("");
    expect(screen.getByLabelText("City")).toHaveValue("");
    expect(screen.getByLabelText("Postal code")).toHaveValue("");
    expect(screen.getByLabelText("Country")).toHaveValue("");
  });

  it("renders a fieldErrors.country response beside the country input", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      jsonResponse(422, {
        code: "VALIDATION_FAILED",
        message: "Check the highlighted fields",
        fieldErrors: { country: ["Enter a two-letter country code"] },
      }),
    ));
    render(<AddressForm onCreated={() => {}} />);
    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "Save address" }));
    expect(await screen.findByText("Enter a two-letter country code")).toBeInTheDocument();
    expect(screen.getByLabelText("Country")).toHaveAttribute("aria-describedby", "country-error");
  });

  it("disables the button while the request is in flight", async () => {
    let release: (value: Response) => void = () => {};
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise<Response>((resolve) => { release = resolve; })));
    render(<AddressForm onCreated={() => {}} />);
    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "Save address" }));
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    release(jsonResponse(201, created));
    await waitFor(() => expect(screen.getByRole("button", { name: "Save address" })).not.toBeDisabled());
  });
});
