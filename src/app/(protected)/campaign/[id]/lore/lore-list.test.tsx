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
    expect(screen.getByText(/lore/i)).toBeInTheDocument();
  });

  it("renders the entry count in the heading", () => {
    render(<LoreList {...defaultProps} />);
    expect(screen.getByText("(2)")).toBeInTheDocument();
  });

  it("renders lore entry titles", () => {
    render(<LoreList {...defaultProps} />);
    // First entry auto-selects so its title appears in both master list and detail
    expect(
      screen.getAllByText("The Founding of Ironhold").length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("The Veil's True Identity")).toBeInTheDocument();
  });

  it("renders selected entry's content in the detail pane", () => {
    render(<LoreList {...defaultProps} />);
    expect(screen.getByText(/founded 300 years ago/)).toBeInTheDocument();
  });

  it("renders tags on the selected entry", () => {
    render(<LoreList {...defaultProps} />);
    // First entry is auto-selected — its tags render in detail badges (plus possibly master list preview)
    expect(screen.getAllByText(/history/i).length).toBeGreaterThanOrEqual(1);
  });

  it("shows GM Only badge in the detail pane when a gm_only entry is selected", async () => {
    const user = userEvent.setup();
    render(<LoreList {...defaultProps} />);
    // Select the second entry (mock has gm_only: true)
    await user.click(screen.getByText("The Veil's True Identity"));
    expect(screen.getByText(/gm only/i)).toBeInTheDocument();
  });

  it("shows empty state when no lore", () => {
    render(<LoreList {...defaultProps} loreEntries={[]} />);
    expect(screen.getByText(/no lore entries yet/i)).toBeInTheDocument();
  });

  it("shows the new-entry overlay for GMs", () => {
    render(<LoreList {...defaultProps} />);
    expect(screen.getByLabelText(/new lore entry/i)).toBeInTheDocument();
  });

  it("hides the new-entry overlay for players", () => {
    render(<LoreList {...defaultProps} role="player" />);
    expect(screen.queryByLabelText(/new lore entry/i)).not.toBeInTheDocument();
  });

  it("opens the create dialog when New is clicked", async () => {
    const user = userEvent.setup();
    render(<LoreList {...defaultProps} />);
    await user.click(screen.getByLabelText(/new lore entry/i));
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
  });

  it("renders a back link to the bookshelf", () => {
    render(<LoreList {...defaultProps} />);
    expect(screen.getByLabelText(/back to bookshelf/i)).toBeInTheDocument();
  });

  it("renders search input", () => {
    render(<LoreList {...defaultProps} />);
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it("filters lore by search term", async () => {
    const user = userEvent.setup();
    render(<LoreList {...defaultProps} />);
    await user.type(screen.getByPlaceholderText(/search/i), "Veil");
    expect(screen.queryByText("The Founding of Ironhold")).not.toBeInTheDocument();
    expect(
      screen.getAllByText("The Veil's True Identity").length
    ).toBeGreaterThanOrEqual(1);
  });

  it("navigates to full detail page when Open full details is clicked", async () => {
    const user = userEvent.setup();
    render(<LoreList {...defaultProps} />);
    await user.click(screen.getByText(/open full details/i));
    // First entry is auto-selected (mock entry id)
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringMatching(/^\/campaign\/campaign-1\/lore\//)
    );
  });
});
