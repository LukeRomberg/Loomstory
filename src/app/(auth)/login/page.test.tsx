import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "./page";
import { createMockSupabaseClient } from "@/test/mocks";

const mockSupabase = createMockSupabaseClient();
const mockPush = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabase,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form", () => {
    render(<LoginPage />);
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByText("Sign in")).toBeInTheDocument();
  });

  it("has links to register and forgot password", () => {
    render(<LoginPage />);
    expect(screen.getByText("Create one")).toBeInTheDocument();
    expect(screen.getByText("Forgot password?")).toBeInTheDocument();
  });

  it("calls signInWithPassword on submit", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "gm@test.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByText("Sign in"));

    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "gm@test.com",
      password: "password123",
    });
  });

  it("redirects to dashboard on success", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "gm@test.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByText("Sign in"));

    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("shows error on login failure", async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: {},
      error: { message: "Invalid credentials" },
    });

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "gm@test.com");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByText("Sign in"));

    expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
  });
});
