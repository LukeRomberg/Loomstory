import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ForgotPasswordPage from "./page";
import { createMockSupabaseClient } from "@/test/mocks";

const mockSupabase = createMockSupabaseClient();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabase,
}));

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders reset form", () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByText("Reset your password")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByText("Send reset link")).toBeInTheDocument();
  });

  it("calls resetPasswordForEmail on submit", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText("Email"), "gm@test.com");
    await user.click(screen.getByText("Send reset link"));

    expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      "gm@test.com",
      expect.any(Object)
    );
  });

  it("shows success message after sending", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText("Email"), "gm@test.com");
    await user.click(screen.getByText("Send reset link"));

    expect(screen.getByText("Check your email")).toBeInTheDocument();
  });
});
