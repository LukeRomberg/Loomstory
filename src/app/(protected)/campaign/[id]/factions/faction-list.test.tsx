import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FactionList } from "./faction-list";
import { mockFaction } from "@/test/mocks";

const mockPush = vi.fn();
vi.mock("@/hooks/use-transition-router", () => ({
  useTransitionRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi
        .fn()
        .mockResolvedValue({ data: { id: "new-fac", name: "New Faction" }, error: null }),
    }),
  }),
}));

const defaultProps = {
  campaignId: "campaign-1",
  campaignName: "Test Campaign",
  factions: [mockFaction],
  role: "gm",
  userId: "user-1",
};

describe("FactionList", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the page heading", () => {
    render(<FactionList {...defaultProps} />);
    expect(screen.getByText(/factions/i)).toBeInTheDocument();
  });

  it("renders the count in the heading", () => {
    render(<FactionList {...defaultProps} />);
    expect(screen.getByText("(1)")).toBeInTheDocument();
  });

  it("renders the faction name (master + detail when auto-selected)", () => {
    render(<FactionList {...defaultProps} />);
    expect(screen.getAllByText(mockFaction.name).length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty state when no factions", () => {
    render(<FactionList {...defaultProps} factions={[]} />);
    expect(screen.getByText(/no factions yet/i)).toBeInTheDocument();
  });

  it("shows the new-faction overlay for GMs", () => {
    render(<FactionList {...defaultProps} />);
    expect(screen.getByLabelText(/new faction/i)).toBeInTheDocument();
  });

  it("hides the new-faction overlay for players", () => {
    render(<FactionList {...defaultProps} role="player" />);
    expect(screen.queryByLabelText(/new faction/i)).not.toBeInTheDocument();
  });

  it("renders a back link to the bookshelf", () => {
    render(<FactionList {...defaultProps} />);
    expect(screen.getByLabelText(/back to bookshelf/i)).toBeInTheDocument();
  });

  it("navigates to detail page when Open full details is clicked", async () => {
    const user = userEvent.setup();
    render(<FactionList {...defaultProps} />);
    await user.click(screen.getByText(/open full details/i));
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringMatching(/^\/campaign\/campaign-1\/factions\//)
    );
  });
});
