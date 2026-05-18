import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FactionList } from "./faction-list";
import { mockFaction } from "@/test/mocks";

const mockPush = vi.fn();
const mockReplace = vi.fn();
let searchParams = new URLSearchParams();
vi.mock("@/hooks/use-transition-router", () => ({
  useTransitionRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: vi.fn(),
  }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: vi.fn(),
  }),
  useSearchParams: () => searchParams,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: { id: "user-1" } } }),
    },
    rpc: vi.fn().mockResolvedValue({ error: null }),
    from: () => ({
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "new-fac", name: "New Faction" },
        error: null,
      }),
    }),
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), loading: vi.fn() },
}));

const defaultProps = {
  campaignId: "campaign-1",
  campaignName: "Test Campaign",
  factions: [mockFaction],
  role: "gm",
  userId: "user-1",
};

describe("FactionList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParams = new URLSearchParams();
  });

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
    expect(
      screen.getAllByText(mockFaction.name).length
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders selected faction's description in the detail pane", () => {
    render(<FactionList {...defaultProps} />);
    // description appears in the master list subtitle and again in the detail
    expect(
      screen.getAllByText(/shadowy guild/).length
    ).toBeGreaterThanOrEqual(1);
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

  it("shows inline Edit affordance for GMs", () => {
    render(<FactionList {...defaultProps} />);
    expect(screen.getAllByText(/edit/i).length).toBeGreaterThanOrEqual(1);
  });

  it("hides inline Edit affordance for players", () => {
    render(<FactionList {...defaultProps} role="player" />);
    expect(screen.queryByText(/^edit$/i)).not.toBeInTheDocument();
  });
});
