import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocationList } from "./location-list";
import { mockLocation } from "@/test/mocks";

const mockPush = vi.fn();
const mockReplace = vi.fn();
let searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, refresh: vi.fn() }),
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
        data: { id: "new-loc", name: "New Loc" },
        error: null,
      }),
    }),
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), loading: vi.fn() },
}));

const fullLocation = {
  ...mockLocation,
  gm_notes: null,
  player_notes: null,
};

const defaultProps = {
  campaignId: "campaign-1",
  campaignName: "Test Campaign",
  locations: [fullLocation],
  role: "gm",
  userId: "user-1",
};

describe("LocationList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParams = new URLSearchParams();
  });

  it("renders the page heading", () => {
    render(<LocationList {...defaultProps} />);
    expect(screen.getByText(/locations/i)).toBeInTheDocument();
  });

  it("renders location name (in master list + selected detail)", () => {
    render(<LocationList {...defaultProps} />);
    expect(screen.getAllByText("Ironhold").length).toBeGreaterThanOrEqual(1);
  });

  it("renders the location type", () => {
    render(<LocationList {...defaultProps} />);
    expect(screen.getAllByText("city").length).toBeGreaterThanOrEqual(1);
  });

  it("renders selected location's description in the detail pane", () => {
    render(<LocationList {...defaultProps} />);
    expect(screen.getByText(/fortified city/)).toBeInTheDocument();
  });

  it("shows empty state when no locations", () => {
    render(<LocationList {...defaultProps} locations={[]} />);
    expect(screen.getByText(/no locations yet/i)).toBeInTheDocument();
  });

  it("shows new-location action for GMs", () => {
    render(<LocationList {...defaultProps} />);
    expect(screen.getByLabelText(/new location/i)).toBeInTheDocument();
  });

  it("hides new-location action for players", () => {
    render(<LocationList {...defaultProps} role="player" />);
    expect(screen.queryByLabelText(/new location/i)).not.toBeInTheDocument();
  });

  it("renders a back link to the bookshelf", () => {
    render(<LocationList {...defaultProps} />);
    expect(screen.getByLabelText(/back to bookshelf/i)).toBeInTheDocument();
  });

  it("shows inline Edit affordance for GMs", () => {
    render(<LocationList {...defaultProps} />);
    expect(screen.getAllByText(/edit/i).length).toBeGreaterThanOrEqual(1);
  });

  it("hides inline Edit affordance for players", () => {
    render(<LocationList {...defaultProps} role="player" />);
    expect(screen.queryByText(/^edit$/i)).not.toBeInTheDocument();
  });

  it("updates URL ?selected when switching selection", async () => {
    const second = {
      ...fullLocation,
      id: "location-2",
      name: "Thornwall",
      description: "A border town near the cursed forest",
      type: "town",
    };
    const user = userEvent.setup();
    render(
      <LocationList {...defaultProps} locations={[fullLocation, second]} />
    );
    await user.click(screen.getByText("Thornwall"));
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringMatching(/[?&]selected=location-2(&|$)/)
    );
  });
});
