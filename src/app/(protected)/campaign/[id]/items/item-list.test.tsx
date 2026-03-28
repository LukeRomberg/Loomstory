import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ItemList } from "./item-list";
import { mockItems } from "@/test/mocks";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
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
    expect(screen.getByText("Items")).toBeInTheDocument();
  });

  it("renders item count", () => {
    render(<ItemList {...defaultProps} />);
    expect(screen.getByText(/2 item/i)).toBeInTheDocument();
  });

  it("renders item names", () => {
    render(<ItemList {...defaultProps} />);
    expect(screen.getByText("Flame Tongue Longsword")).toBeInTheDocument();
    expect(screen.getByText("Sealed Letter")).toBeInTheDocument();
  });

  it("renders item type badges", () => {
    render(<ItemList {...defaultProps} />);
    expect(screen.getByText("weapon")).toBeInTheDocument();
    expect(screen.getByText("document")).toBeInTheDocument();
  });

  it("renders descriptions", () => {
    render(<ItemList {...defaultProps} />);
    expect(screen.getByText(/magical longsword/)).toBeInTheDocument();
  });

  it("shows gm_only indicator for hidden items", () => {
    render(<ItemList {...defaultProps} />);
    expect(screen.getAllByText(/gm only/i).length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty state when no items", () => {
    render(<ItemList {...defaultProps} items={[]} />);
    expect(screen.getByText(/no items yet/i)).toBeInTheDocument();
  });

  it("shows create button for GMs", () => {
    render(<ItemList {...defaultProps} />);
    expect(screen.getByText(/new item/i)).toBeInTheDocument();
  });

  it("hides create button for players", () => {
    render(<ItemList {...defaultProps} role="player" />);
    expect(screen.queryByText(/new item/i)).not.toBeInTheDocument();
  });

  it("opens create dialog when button is clicked", async () => {
    const user = userEvent.setup();
    render(<ItemList {...defaultProps} />);
    await user.click(screen.getByText(/new item/i));
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });

  it("has a back button to campaign page", () => {
    render(<ItemList {...defaultProps} />);
    expect(screen.getByText(/test campaign/i)).toBeInTheDocument();
  });
});
