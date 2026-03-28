import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoreList } from "./lore-list";
import { mockLoreEntries } from "@/test/mocks";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: "new-lore" }, error: null }),
    }),
  }),
}));

const defaultProps = {
  campaignId: "campaign-1",
  campaignName: "Test Campaign",
  loreEntries: mockLoreEntries,
  role: "gm",
  userId: "user-1",
};

describe("LoreList", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the page heading", () => {
    render(<LoreList {...defaultProps} />);
    expect(screen.getByText("Lore")).toBeInTheDocument();
  });

  it("renders lore entry count", () => {
    render(<LoreList {...defaultProps} />);
    expect(screen.getByText(/2 entr/i)).toBeInTheDocument();
  });

  it("renders lore entry titles", () => {
    render(<LoreList {...defaultProps} />);
    expect(screen.getByText("The Founding of Ironhold")).toBeInTheDocument();
    expect(screen.getByText("The Veil's True Identity")).toBeInTheDocument();
  });

  it("renders content preview", () => {
    render(<LoreList {...defaultProps} />);
    expect(screen.getByText(/founded 300 years ago/)).toBeInTheDocument();
  });

  it("renders tags as badges", () => {
    render(<LoreList {...defaultProps} />);
    expect(screen.getByText("history")).toBeInTheDocument();
    expect(screen.getByText("ironhold")).toBeInTheDocument();
    expect(screen.getByText("dwarves")).toBeInTheDocument();
  });

  it("shows gm_only indicator for hidden entries", () => {
    render(<LoreList {...defaultProps} />);
    expect(screen.getAllByText(/gm only/i).length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty state when no lore", () => {
    render(<LoreList {...defaultProps} loreEntries={[]} />);
    expect(screen.getByText(/no lore entries yet/i)).toBeInTheDocument();
  });

  it("shows create button for GMs", () => {
    render(<LoreList {...defaultProps} />);
    expect(screen.getByText(/new entry/i)).toBeInTheDocument();
  });

  it("hides create button for players", () => {
    render(<LoreList {...defaultProps} role="player" />);
    expect(screen.queryByText(/new entry/i)).not.toBeInTheDocument();
  });

  it("opens create dialog when button is clicked", async () => {
    const user = userEvent.setup();
    render(<LoreList {...defaultProps} />);
    await user.click(screen.getByText(/new entry/i));
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
  });

  it("has a back button to campaign page", () => {
    render(<LoreList {...defaultProps} />);
    expect(screen.getByText(/test campaign/i)).toBeInTheDocument();
  });

  // ─── Tag Filter ───────────────────────────────────────────

  it("renders search input for filtering", () => {
    render(<LoreList {...defaultProps} />);
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it("filters lore by search term", async () => {
    const user = userEvent.setup();
    render(<LoreList {...defaultProps} />);
    await user.type(screen.getByPlaceholderText(/search/i), "Veil");
    expect(screen.queryByText("The Founding of Ironhold")).not.toBeInTheDocument();
    expect(screen.getByText("The Veil's True Identity")).toBeInTheDocument();
  });
});
