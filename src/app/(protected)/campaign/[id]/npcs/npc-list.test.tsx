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
      single: vi
        .fn()
        .mockResolvedValue({ data: { id: "new-npc", name: "New NPC" }, error: null }),
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
    // First NPC auto-selects, so name appears in both master + detail
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
    expect(screen.getByText(/gm only/i)).toBeInTheDocument();
  });

  it("renders a back link to the bookshelf", () => {
    render(<NpcList {...defaultProps} />);
    expect(screen.getByLabelText(/back to bookshelf/i)).toBeInTheDocument();
  });

  it("navigates to full detail page when Open full details is clicked", async () => {
    const user = userEvent.setup();
    render(<NpcList {...defaultProps} />);
    await user.click(screen.getByText(/open full details/i));
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringMatching(/^\/campaign\/campaign-1\/npcs\//)
    );
  });

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
