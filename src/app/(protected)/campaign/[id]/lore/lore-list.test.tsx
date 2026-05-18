import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoreList } from "./lore-list";
import { mockLoreEntries } from "@/test/mocks";

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
        data: { id: "new-lore", title: "New" },
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
  loreEntries: mockLoreEntries,
  role: "gm",
  userId: "user-1",
};

describe("LoreList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParams = new URLSearchParams();
  });

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
    expect(screen.getAllByText(/history/i).length).toBeGreaterThanOrEqual(1);
  });

  it("shows GM Only badge in the detail pane when a gm_only entry is selected", async () => {
    const user = userEvent.setup();
    render(<LoreList {...defaultProps} />);
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
    expect(
      screen.queryByText("The Founding of Ironhold")
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByText("The Veil's True Identity").length
    ).toBeGreaterThanOrEqual(1);
  });

  it("shows inline Edit affordance for GMs", () => {
    render(<LoreList {...defaultProps} />);
    expect(screen.getAllByText(/edit/i).length).toBeGreaterThanOrEqual(1);
  });

  it("hides inline Edit affordance for players", () => {
    render(<LoreList {...defaultProps} role="player" />);
    expect(screen.queryByText(/^edit$/i)).not.toBeInTheDocument();
  });
});
