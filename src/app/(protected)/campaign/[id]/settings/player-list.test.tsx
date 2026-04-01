import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlayerList } from "./player-list";
import { mockMembers } from "@/test/mocks";

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: mockRefresh }),
}));

const mockUpdate = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null }),
});

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      update: mockUpdate,
    }),
  }),
}));

const defaultProps = {
  campaignId: "campaign-1",
  members: mockMembers,
  currentUserId: "test-user-id",
};

describe("PlayerList", () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── Rendering ──────────────────────────────────────────

  it("renders the section heading", () => {
    render(<PlayerList {...defaultProps} />);
    expect(screen.getByText("Members")).toBeInTheDocument();
  });

  it("renders member count", () => {
    render(<PlayerList {...defaultProps} />);
    expect(screen.getByText(/2 members/i)).toBeInTheDocument();
  });

  it("renders member display names", () => {
    render(<PlayerList {...defaultProps} />);
    expect(screen.getByText("Test GM")).toBeInTheDocument();
    expect(screen.getByText("Player One")).toBeInTheDocument();
  });

  it("renders role badges", () => {
    render(<PlayerList {...defaultProps} />);
    expect(screen.getByText("gm")).toBeInTheDocument();
    expect(screen.getByText("player")).toBeInTheDocument();
  });

  it("shows 'You' indicator for current user", () => {
    render(<PlayerList {...defaultProps} />);
    expect(screen.getByText(/you/i)).toBeInTheDocument();
  });

  it("shows empty state when only GM is a member", () => {
    const gmOnly = [mockMembers[0]];
    render(<PlayerList {...defaultProps} members={gmOnly} />);
    expect(screen.getByText(/no players yet/i)).toBeInTheDocument();
  });

  // ─── Remove Player ───────────────────────────────────

  it("shows remove button only for non-GM members", () => {
    render(<PlayerList {...defaultProps} />);
    const removeButtons = screen.getAllByRole("button", { name: /remove/i });
    // Only 1 remove button — for Player One, not the GM
    expect(removeButtons).toHaveLength(1);
  });

  it("does not show remove button for the GM", () => {
    render(<PlayerList {...defaultProps} />);
    // The GM row should NOT have a remove button
    const gmRow = screen.getByText("Test GM").closest("[data-member]");
    expect(gmRow?.querySelector("[aria-label='Remove']")).toBeNull();
  });

  it("opens confirmation dialog on remove click", async () => {
    const user = userEvent.setup();
    render(<PlayerList {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /remove/i }));
    expect(screen.getByText(/remove player one/i)).toBeInTheDocument();
  });

  it("soft-deletes the member on confirmation", async () => {
    const user = userEvent.setup();
    render(<PlayerList {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /remove/i }));
    const confirmBtn = await screen.findByRole("button", { name: /^confirm$/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          deleted_at: expect.any(String),
        })
      );
    });
  });

  it("removes the member from the list after deletion", async () => {
    const user = userEvent.setup();
    render(<PlayerList {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /remove/i }));
    const confirmBtn = await screen.findByRole("button", { name: /^confirm$/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(screen.queryByText("Player One")).not.toBeInTheDocument();
    });
  });

  it("cancelling remove does not delete the member", async () => {
    const user = userEvent.setup();
    render(<PlayerList {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /remove/i }));
    const cancelBtn = await screen.findByRole("button", { name: /cancel/i });
    await user.click(cancelBtn);

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(screen.getByText("Player One")).toBeInTheDocument();
  });
});
