import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HomePage from "../app/page";
import type { UserProfile } from "../lib/types";

const useSessionMock = vi.fn();

vi.mock("../lib/session", () => ({
  useSession: () => useSessionMock(),
}));

const profile: UserProfile = {
  id: "usr_1",
  email: "sam@example.com",
  name: "Sam Sample",
  phone: null,
  role: "USER",
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("HomePage", () => {
  it("signed out: shows the intro paragraph and both calls to action", () => {
    useSessionMock.mockReturnValue({ profile: null, loading: false, refresh: vi.fn(), signOut: vi.fn() });
    render(<HomePage />);
    expect(screen.getByText(/account, profile, and saved addresses/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create an account" })).toBeInTheDocument();
  });

  it("signed out: shows no greeting", () => {
    useSessionMock.mockReturnValue({ profile: null, loading: false, refresh: vi.fn(), signOut: vi.fn() });
    render(<HomePage />);
    expect(screen.queryByText(/welcome/i)).not.toBeInTheDocument();
  });

  it("signed in: the greeting contains the user's name", () => {
    useSessionMock.mockReturnValue({ profile, loading: false, refresh: vi.fn(), signOut: vi.fn() });
    render(<HomePage />);
    expect(screen.getByRole("heading")).toHaveTextContent(profile.name);
  });

  it("signed in: shows links to the profile and the addresses", () => {
    useSessionMock.mockReturnValue({ profile, loading: false, refresh: vi.fn(), signOut: vi.fn() });
    render(<HomePage />);
    expect(screen.getByRole("link", { name: "Your profile" })).toHaveAttribute("href", "/profile");
    expect(screen.getByRole("link", { name: "Your addresses" })).toHaveAttribute("href", "/addresses");
  });
});
