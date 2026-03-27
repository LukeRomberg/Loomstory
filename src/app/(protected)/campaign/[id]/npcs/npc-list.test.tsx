import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NpcList } from "./npc-list";
import { mockNpc } from "@/test/mocks";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: "new-npc", name: "New NPC" }, error: null }),
    }),
  }),
}));

const defaultProps = {
  campaignId: "campaign-1",
  campaignName: "Test Campaign",
  npcs: [mockNpc],
  role: "gm",
  userId: "user-1",
};

describe("NpcList", () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── Rendering ────────────────────────────────────────────

  it("renders the page heading", () => {
    render(<NpcList {...defaultProps} />);
    expect(screen.getByText("NPCs")).toBeInTheDocument();
  });

  it("renders NPC count", () => {
    render(<NpcList {...defaultProps} />);
    expect(screen.getByText(/1 npc/i)).toBeInTheDocument();
  });

  it("renders NPC cards with name", () => {
    render(<NpcList {...defaultProps} />);
    expect(screen.getByText("Gareth the Bold")).toBeInTheDocument();
  });

  it("renders NPC status badge", () => {
    render(<NpcList {...defaultProps} />);
    expect(screen.getByText("alive")).toBeInTheDocument();
  });

  it("renders NPC description", () => {
    render(<NpcList {...defaultProps} />);
    expect(screen.getByText(/tall, scarred warrior/)).toBeInTheDocument();
  });

  it("renders NPC tags as badges", () => {
    render(<NpcList {...defaultProps} />);
    expect(screen.getByText("ally")).toBeInTheDocument();
    expect(screen.getByText("warrior")).toBeInTheDocument();
  });

  it("shows empty state when no NPCs", () => {
    render(<NpcList {...defaultProps} npcs={[]} />);
    expect(screen.getByText(/no npcs yet/i)).toBeInTheDocument();
  });

  it("shows gm_only indicator for hidden NPCs", () => {
    const hiddenNpc = { ...mockNpc, gm_only: true };
    render(<NpcList {...defaultProps} npcs={[hiddenNpc]} />);
    expect(screen.getByText(/gm only/i)).toBeInTheDocument();
  });

  // ─── Navigation ───────────────────────────────────────────

  it("has a back button to campaign page", () => {
    render(<NpcList {...defaultProps} />);
    expect(screen.getByText(/test campaign/i)).toBeInTheDocument();
  });

  it("navigates to NPC detail on card click", async () => {
    const user = userEvent.setup();
    render(<NpcList {...defaultProps} />);
    await user.click(screen.getByText("Gareth the Bold"));
    expect(mockPush).toHaveBeenCalledWith(
      "/campaign/campaign-1/npcs/npc-1"
    );
  });

  // ─── Create ───────────────────────────────────────────────

  it("shows create button for GMs", () => {
    render(<NpcList {...defaultProps} />);
    expect(screen.getByText(/new npc/i)).toBeInTheDocument();
  });

  it("hides create button for players", () => {
    render(<NpcList {...defaultProps} role="player" />);
    expect(screen.queryByText(/new npc/i)).not.toBeInTheDocument();
  });

  it("opens create dialog when button is clicked", async () => {
    const user = userEvent.setup();
    render(<NpcList {...defaultProps} />);
    await user.click(screen.getByText(/new npc/i));
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });
});
