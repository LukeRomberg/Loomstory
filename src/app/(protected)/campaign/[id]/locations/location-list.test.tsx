import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocationList } from "./location-list";
import { mockLocation } from "@/test/mocks";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi
        .fn()
        .mockResolvedValue({ data: { id: "new-loc", name: "New Loc" }, error: null }),
    }),
  }),
}));

const defaultProps = {
  campaignId: "campaign-1",
  campaignName: "Test Campaign",
  locations: [mockLocation],
  role: "gm",
  userId: "user-1",
};

describe("LocationList", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the page heading", () => {
    render(<LocationList {...defaultProps} />);
    expect(screen.getByText(/locations/i)).toBeInTheDocument();
  });

  it("renders location name (in master list + selected detail)", () => {
    render(<LocationList {...defaultProps} />);
    // First location auto-selects so name shows in both master list and detail
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

  it("navigates to full detail page when Open full details is clicked", async () => {
    const user = userEvent.setup();
    render(<LocationList {...defaultProps} />);
    await user.click(screen.getByText(/open full details/i));
    expect(mockPush).toHaveBeenCalledWith(
      "/campaign/campaign-1/locations/location-1"
    );
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
});
