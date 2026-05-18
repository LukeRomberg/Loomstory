import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ItemList } from "./item-list";
import { mockItems } from "@/test/mocks";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("@/hooks/use-transition-router", () => ({
  useTransitionRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: "new-item" }, error: null }),
    }),
  }),
}));

const defaultProps = {
  campaignId: "campaign-1",
  campaignName: "Test Campaign",
  items: mockItems,
  role: "gm",
  userId: "user-1",
};

describe("ItemList", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the page heading", () => {
    render(<ItemList {...defaultProps} />);
    expect(screen.getByText(/items/i)).toBeInTheDocument();
  });

  it("renders the count in the heading", () => {
    render(<ItemList {...defaultProps} />);
    expect(screen.getByText(`(${mockItems.length})`)).toBeInTheDocument();
  });

  it("renders item names in the master list", () => {
    render(<ItemList {...defaultProps} />);
    for (const i of mockItems) {
      expect(screen.getAllByText(i.name).length).toBeGreaterThanOrEqual(1);
    }
  });

  it("shows empty state when no items", () => {
    render(<ItemList {...defaultProps} items={[]} />);
    expect(screen.getByText(/no items yet/i)).toBeInTheDocument();
  });

  it("shows the new-item overlay for GMs", () => {
    render(<ItemList {...defaultProps} />);
    expect(screen.getByLabelText(/new item/i)).toBeInTheDocument();
  });

  it("hides the new-item overlay for players", () => {
    render(<ItemList {...defaultProps} role="player" />);
    expect(screen.queryByLabelText(/new item/i)).not.toBeInTheDocument();
  });

  it("renders a back link to the bookshelf", () => {
    render(<ItemList {...defaultProps} />);
    expect(screen.getByLabelText(/back to bookshelf/i)).toBeInTheDocument();
  });
});
