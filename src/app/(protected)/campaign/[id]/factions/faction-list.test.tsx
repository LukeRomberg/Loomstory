import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FactionList } from "./faction-list";
import { mockFaction } from "@/test/mocks";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: "new-fac", name: "New Faction" }, error: null }),
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
    expect(screen.getByText("Factions")).toBeInTheDocument();
  });

  it("renders faction cards with name", () => {
    render(<FactionList {...defaultProps} />);
    expect(screen.getByText("The Crimson Hand")).toBeInTheDocument();
  });

  it("renders faction description", () => {
    render(<FactionList {...defaultProps} />);
    expect(screen.getByText(/shadowy guild/)).toBeInTheDocument();
  });

  it("shows gm_only indicator for hidden factions", () => {
    render(<FactionList {...defaultProps} />);
    expect(screen.getByText(/gm only/i)).toBeInTheDocument();
  });

  it("shows empty state when no factions", () => {
    render(<FactionList {...defaultProps} factions={[]} />);
    expect(screen.getByText(/no factions yet/i)).toBeInTheDocument();
  });

  it("navigates to faction detail on card click", async () => {
    const user = userEvent.setup();
    render(<FactionList {...defaultProps} />);
    await user.click(screen.getByText("The Crimson Hand"));
    expect(mockPush).toHaveBeenCalledWith(
      "/campaign/campaign-1/factions/faction-1"
    );
  });

  it("shows create button for GMs", () => {
    render(<FactionList {...defaultProps} />);
    expect(screen.getByText(/new faction/i)).toBeInTheDocument();
  });

  it("hides create button for players", () => {
    render(<FactionList {...defaultProps} role="player" />);
    expect(screen.queryByText(/new faction/i)).not.toBeInTheDocument();
  });
});
