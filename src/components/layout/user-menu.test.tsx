import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserMenu } from "./user-menu";
import { createMockSupabaseClient } from "@/test/mocks";

const mockSupabase = createMockSupabaseClient();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabase,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("UserMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders avatar with initials for multi-word name", () => {
    render(<UserMenu displayName="Test GM" />);
    expect(screen.getByText("TG")).toBeInTheDocument();
  });

  it("renders first letter for single-word name", () => {
    render(<UserMenu displayName="Gandalf" />);
    expect(screen.getByText("G")).toBeInTheDocument();
  });

  it("renders trigger button with menu role", () => {
    render(<UserMenu displayName="Test GM" />);
    const trigger = screen.getByRole("button");
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
  });
});
