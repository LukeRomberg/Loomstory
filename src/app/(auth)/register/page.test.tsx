import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "./page";
import { createMockSupabaseClient } from "@/test/mocks";

const mockSupabase = createMockSupabaseClient();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabase,
}));

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders registration form", () => {
    render(<RegisterPage />);
    expect(screen.getByText("Create an account")).toBeInTheDocument();
    expect(screen.getByLabelText("Display Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByText("Create account")).toBeInTheDocument();
  });

  it("has link to login page", () => {
    render(<RegisterPage />);
    expect(screen.getByText("Sign in")).toBeInTheDocument();
  });

  it("calls signUp with form data on submit", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText("Display Name"), "Test GM");
    await user.type(screen.getByLabelText("Email"), "gm@test.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByText("Create account"));

    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "gm@test.com",
        password: "password123",
      })
    );
  });

  it("shows success message after signup", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText("Display Name"), "Test GM");
    await user.type(screen.getByLabelText("Email"), "gm@test.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByText("Create account"));

    expect(screen.getByText("Check your email")).toBeInTheDocument();
  });

  it("shows error on signup failure", async () => {
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: {},
      error: { message: "Email already registered" },
    });

    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText("Display Name"), "Test GM");
    await user.type(screen.getByLabelText("Email"), "gm@test.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByText("Create account"));

    expect(screen.getByText("Email already registered")).toBeInTheDocument();
  });
});
