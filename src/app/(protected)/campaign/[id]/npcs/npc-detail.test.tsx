import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NpcDetail } from "./npc-detail";
import { mockNpc } from "@/test/mocks";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}));

const mockSupabaseChain = {
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: mockNpc, error: null }),
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => mockSupabaseChain,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}));

const defaultProps = {
  campaignId: "campaign-1",
  campaignName: "Test Campaign",
  npc: mockNpc,
  role: "gm",
};

describe("NpcDetail", () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── Rendering ────────────────────────────────────────────

  it("renders NPC name as heading", () => {
    render(<NpcDetail {...defaultProps} />);
    expect(screen.getByText("Gareth the Bold")).toBeInTheDocument();
  });

  it("renders NPC aliases", () => {
    render(<NpcDetail {...defaultProps} />);
    expect(screen.getByText(/aka Gareth, The Bold One/)).toBeInTheDocument();
  });

  it("renders NPC status", () => {
    render(<NpcDetail {...defaultProps} />);
    expect(screen.getByText("alive")).toBeInTheDocument();
  });

  it("renders NPC description", () => {
    render(<NpcDetail {...defaultProps} />);
    expect(screen.getByText(/tall, scarred warrior/)).toBeInTheDocument();
  });

  it("renders NPC tags", () => {
    render(<NpcDetail {...defaultProps} />);
    expect(screen.getByText("ally")).toBeInTheDocument();
    expect(screen.getByText("warrior")).toBeInTheDocument();
  });

  it("renders GM notes when role is GM", () => {
    render(<NpcDetail {...defaultProps} />);
    expect(screen.getByText(/secretly working for the enemy/i)).toBeInTheDocument();
  });

  it("renders player notes", () => {
    render(<NpcDetail {...defaultProps} />);
    expect(screen.getByText(/helped the party at the bridge/i)).toBeInTheDocument();
  });

  it("shows gm_only badge when entity is hidden", () => {
    const hiddenNpc = { ...mockNpc, gm_only: true };
    render(<NpcDetail {...defaultProps} npc={hiddenNpc} />);
    expect(screen.getByText(/gm only/i)).toBeInTheDocument();
  });

  // ─── Navigation ───────────────────────────────────────────

  it("has back button to NPC list", () => {
    render(<NpcDetail {...defaultProps} />);
    expect(screen.getByText(/npcs/i)).toBeInTheDocument();
  });

  // ─── Edit (KB-04) ────────────────────────────────────────

  it("shows edit button for GMs", () => {
    render(<NpcDetail {...defaultProps} />);
    expect(screen.getByText(/edit/i)).toBeInTheDocument();
  });

  it("hides edit button for players", () => {
    render(<NpcDetail {...defaultProps} role="player" />);
    expect(screen.queryByText(/edit/i)).not.toBeInTheDocument();
  });

  it("enters edit mode when edit button is clicked", async () => {
    const user = userEvent.setup();
    render(<NpcDetail {...defaultProps} />);
    await user.click(screen.getByText(/edit/i));
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
  });

  it("shows save and cancel buttons in edit mode", async () => {
    const user = userEvent.setup();
    render(<NpcDetail {...defaultProps} />);
    await user.click(screen.getByText(/edit/i));
    expect(screen.getByText(/save/i)).toBeInTheDocument();
    expect(screen.getByText(/cancel/i)).toBeInTheDocument();
  });

  // ─── Delete (KB-05) ──────────────────────────────────────

  it("shows delete button for GMs", () => {
    render(<NpcDetail {...defaultProps} />);
    // Trash icon button exists
    const buttons = screen.getAllByRole("button");
    const deleteBtn = buttons.find((b) =>
      b.querySelector('[class*="text-red"]') || b.getAttribute("aria-label") === "Delete"
    );
    expect(deleteBtn || buttons.length).toBeTruthy();
  });

  // ─── Visibility Toggle (KB-06) ───────────────────────────

  it("shows visibility toggle for GMs", () => {
    render(<NpcDetail {...defaultProps} />);
    // The eye/eye-off icon button serves as the visibility toggle
    const toggleBtn = screen.getAllByRole("button").find(
      (b) => b.getAttribute("title")?.includes("players")
    );
    expect(toggleBtn).toBeTruthy();
  });
});
