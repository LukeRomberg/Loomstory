import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NpcList } from "./npc-list";
import { mockNpc } from "@/test/mocks";

const mockPush = vi.fn();
const mockReplace = vi.fn();
let searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, refresh: vi.fn() }),
  useSearchParams: () => searchParams,
}));

const insertSingle = vi
  .fn()
  .mockResolvedValue({
    data: { id: "new-npc", name: "New NPC" },
    error: null,
  });
const rpc = vi.fn().mockResolvedValue({ error: null });
const getUser = vi
  .fn()
  .mockResolvedValue({ data: { user: { id: "user-1" } } });

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser },
    rpc,
    from: () => ({
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnThis(),
      single: insertSingle,
    }),
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}));

const secondNpc = {
  ...mockNpc,
  id: "npc-2",
  name: "Mira the Sly",
  description: "A nimble thief with a sharp tongue",
  tags: ["rogue"],
  aliases: ["Mira"],
  gm_notes: "Plotting to betray the party",
  player_notes: "Met in the tavern",
};

const defaultProps = {
  campaignId: "campaign-1",
  campaignName: "Test Campaign",
  npcs: [mockNpc],
  role: "gm",
  userId: "user-1",
};

describe("NpcList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParams = new URLSearchParams();
  });

  it("renders the page heading", () => {
    render(<NpcList {...defaultProps} />);
    expect(screen.getByText(/npcs/i)).toBeInTheDocument();
  });

  it("renders the count in the heading", () => {
    render(<NpcList {...defaultProps} />);
    expect(screen.getByText("(1)")).toBeInTheDocument();
  });

  it("renders the NPC name", () => {
    render(<NpcList {...defaultProps} />);
    expect(screen.getAllByText("Gareth the Bold").length).toBeGreaterThanOrEqual(1);
  });

  it("renders the NPC status", () => {
    render(<NpcList {...defaultProps} />);
    expect(screen.getAllByText(/alive/i).length).toBeGreaterThanOrEqual(1);
  });

  it("renders selected NPC's description in the detail pane", () => {
    render(<NpcList {...defaultProps} />);
    expect(screen.getByText(/tall, scarred warrior/)).toBeInTheDocument();
  });

  it("renders selected NPC's tags as badges", () => {
    render(<NpcList {...defaultProps} />);
    expect(screen.getAllByText("ally").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("warrior").length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty state when no NPCs", () => {
    render(<NpcList {...defaultProps} npcs={[]} />);
    expect(screen.getByText(/no npcs yet/i)).toBeInTheDocument();
  });

  it("shows GM Only badge when a gm_only NPC is selected", () => {
    const hiddenNpc = { ...mockNpc, gm_only: true };
    render(<NpcList {...defaultProps} npcs={[hiddenNpc]} />);
    expect(screen.getAllByText(/gm only/i).length).toBeGreaterThanOrEqual(1);
  });

  it("renders a back link to the bookshelf", () => {
    render(<NpcList {...defaultProps} />);
    expect(screen.getByLabelText(/back to bookshelf/i)).toBeInTheDocument();
  });

  // ─── Inline detail panel ─────────────────────────────────

  it("renders selected NPC's GM notes inline for GMs", () => {
    render(<NpcList {...defaultProps} />);
    expect(
      screen.getByText(/secretly working for the enemy/i)
    ).toBeInTheDocument();
  });

  it("hides GM notes when role is player", () => {
    render(<NpcList {...defaultProps} role="player" />);
    expect(
      screen.queryByText(/secretly working for the enemy/i)
    ).not.toBeInTheDocument();
  });

  it("renders selected NPC's player notes inline", () => {
    render(<NpcList {...defaultProps} />);
    expect(
      screen.getByText(/helped the party at the bridge/i)
    ).toBeInTheDocument();
  });

  it("shows inline Edit affordance for GMs", () => {
    render(<NpcList {...defaultProps} />);
    expect(screen.getAllByText(/edit/i).length).toBeGreaterThanOrEqual(1);
  });

  it("hides inline Edit affordance for players", () => {
    render(<NpcList {...defaultProps} role="player" />);
    expect(screen.queryByText(/^edit$/i)).not.toBeInTheDocument();
  });

  it("shows inline visibility toggle for GMs", () => {
    render(<NpcList {...defaultProps} />);
    const toggleBtn = screen
      .getAllByRole("button")
      .find((b) => b.getAttribute("title")?.includes("players"));
    expect(toggleBtn).toBeTruthy();
  });

  // ─── URL ?selected param ─────────────────────────────────

  it("selects NPC matching ?selected URL param on mount", () => {
    searchParams = new URLSearchParams("selected=npc-2");
    render(<NpcList {...defaultProps} npcs={[mockNpc, secondNpc]} />);
    expect(screen.getByText(/nimble thief with a sharp tongue/)).toBeInTheDocument();
    expect(
      screen.queryByText(/tall, scarred warrior/)
    ).not.toBeInTheDocument();
  });

  it("updates URL ?selected when switching selection in master list", async () => {
    const user = userEvent.setup();
    render(<NpcList {...defaultProps} npcs={[mockNpc, secondNpc]} />);
    await user.click(screen.getByText("Mira the Sly"));
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringMatching(/[?&]selected=npc-2(&|$)/)
    );
  });

  // ─── Inline delete ───────────────────────────────────────

  it("removes NPC from list and clears selection after successful delete", async () => {
    const user = userEvent.setup();
    render(<NpcList {...defaultProps} npcs={[mockNpc, secondNpc]} />);
    // Open the inline delete dialog (trash button has red-tinted icon)
    const trashBtn = screen
      .getAllByRole("button")
      .find((b) => b.querySelector('[class*="text-red"]'));
    expect(trashBtn).toBeTruthy();
    await user.click(trashBtn!);
    // Confirm
    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    // First NPC removed; selection falls back to the remaining one
    expect(rpc).toHaveBeenCalledWith(
      "soft_delete_entity",
      expect.objectContaining({ p_entity_id: "npc-1" })
    );
    expect(
      screen.queryByText(/tall, scarred warrior/)
    ).not.toBeInTheDocument();
  });

  // ─── Create flow ─────────────────────────────────────────

  it("shows the new-NPC overlay for GMs", () => {
    render(<NpcList {...defaultProps} />);
    expect(screen.getByLabelText(/new npc/i)).toBeInTheDocument();
  });

  it("hides the new-NPC overlay for players", () => {
    render(<NpcList {...defaultProps} role="player" />);
    expect(screen.queryByLabelText(/new npc/i)).not.toBeInTheDocument();
  });

  it("opens the create dialog when New is clicked", async () => {
    const user = userEvent.setup();
    render(<NpcList {...defaultProps} />);
    await user.click(screen.getByLabelText(/new npc/i));
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });
});
