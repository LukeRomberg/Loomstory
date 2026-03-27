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
      single: vi.fn().mockResolvedValue({ data: { id: "new-loc", name: "New Loc" }, error: null }),
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
    expect(screen.getByText("Locations")).toBeInTheDocument();
  });

  it("renders location cards with name", () => {
    render(<LocationList {...defaultProps} />);
    expect(screen.getByText("Ironhold")).toBeInTheDocument();
  });

  it("renders location type badge", () => {
    render(<LocationList {...defaultProps} />);
    expect(screen.getByText("city")).toBeInTheDocument();
  });

  it("renders location description", () => {
    render(<LocationList {...defaultProps} />);
    expect(screen.getByText(/fortified city/)).toBeInTheDocument();
  });

  it("shows empty state when no locations", () => {
    render(<LocationList {...defaultProps} locations={[]} />);
    expect(screen.getByText(/no locations yet/i)).toBeInTheDocument();
  });

  it("navigates to location detail on card click", async () => {
    const user = userEvent.setup();
    render(<LocationList {...defaultProps} />);
    await user.click(screen.getByText("Ironhold"));
    expect(mockPush).toHaveBeenCalledWith(
      "/campaign/campaign-1/locations/location-1"
    );
  });

  it("shows create button for GMs", () => {
    render(<LocationList {...defaultProps} />);
    expect(screen.getByText(/new location/i)).toBeInTheDocument();
  });

  it("hides create button for players", () => {
    render(<LocationList {...defaultProps} role="player" />);
    expect(screen.queryByText(/new location/i)).not.toBeInTheDocument();
  });
});
