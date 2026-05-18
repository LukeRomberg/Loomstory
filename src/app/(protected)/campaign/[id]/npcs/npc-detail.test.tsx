import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NpcDetail } from "./npc-detail";
import { mockNpc } from "@/test/mocks";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), refresh: vi.fn() }),
}));

const rpc = vi.fn().mockResolvedValue({ error: null });
const getUser = vi
  .fn()
  .mockResolvedValue({ data: { user: { id: "user-1" } } });
const mockSupabaseChain = {
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockResolvedValue({ error: null }),
  select: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: mockNpc, error: null }),
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser },
    rpc,
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
  npc: mockNpc,
  role: "gm",
  userId: "user-1",
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
    expect(screen.getByText(/Gareth, The Bold One/)).toBeInTheDocument();
  });

  it("renders NPC status", () => {
    render(<NpcDetail {...defaultProps} />);
    expect(screen.getByText(/alive/i)).toBeInTheDocument();
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

  it("hides GM notes when role is player", () => {
    render(<NpcDetail {...defaultProps} role="player" />);
    expect(
      screen.queryByText(/secretly working for the enemy/i)
    ).not.toBeInTheDocument();
  });

  it("renders player notes", () => {
    render(<NpcDetail {...defaultProps} />);
    expect(screen.getByText(/helped the party at the bridge/i)).toBeInTheDocument();
  });

  it("shows gm_only badge when entity is hidden", () => {
    const hiddenNpc = { ...mockNpc, gm_only: true };
    render(<NpcDetail {...defaultProps} npc={hiddenNpc} />);
    expect(screen.getAllByText(/gm only/i).length).toBeGreaterThanOrEqual(1);
  });

  // ─── Edit (KB-04) ────────────────────────────────────────

  it("shows edit button for GMs", () => {
    render(<NpcDetail {...defaultProps} />);
    expect(screen.getAllByText(/edit/i).length).toBeGreaterThanOrEqual(1);
  });

  it("hides edit button for players", () => {
    render(<NpcDetail {...defaultProps} role="player" />);
    expect(screen.queryByText(/^edit$/i)).not.toBeInTheDocument();
  });

  it("enters edit mode when edit button is clicked", async () => {
    const user = userEvent.setup();
    render(<NpcDetail {...defaultProps} />);
    await user.click(screen.getAllByText(/edit/i)[0]);
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
  });

  it("shows save and cancel buttons in edit mode", async () => {
    const user = userEvent.setup();
    render(<NpcDetail {...defaultProps} />);
    await user.click(screen.getAllByText(/edit/i)[0]);
    expect(screen.getByText(/save/i)).toBeInTheDocument();
    expect(screen.getByText(/cancel/i)).toBeInTheDocument();
  });

  // ─── Delete (KB-05) ──────────────────────────────────────

  it("shows delete button for GMs", () => {
    render(<NpcDetail {...defaultProps} />);
    const trashBtn = screen
      .getAllByRole("button")
      .find((b) => b.querySelector('[class*="text-red"]'));
    expect(trashBtn).toBeTruthy();
  });

  it("calls onDeleted after successful delete", async () => {
    const onDeleted = vi.fn();
    const user = userEvent.setup();
    render(<NpcDetail {...defaultProps} onDeleted={onDeleted} />);
    const trashBtn = screen
      .getAllByRole("button")
      .find((b) => b.querySelector('[class*="text-red"]'));
    await user.click(trashBtn!);
    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(rpc).toHaveBeenCalledWith(
      "soft_delete_entity",
      expect.objectContaining({ p_entity_id: "npc-1" })
    );
    expect(onDeleted).toHaveBeenCalled();
  });

  // ─── Visibility Toggle (KB-06) ───────────────────────────

  it("shows visibility toggle for GMs", () => {
    render(<NpcDetail {...defaultProps} />);
    const toggleBtn = screen
      .getAllByRole("button")
      .find((b) => b.getAttribute("title")?.includes("players"));
    expect(toggleBtn).toBeTruthy();
  });
});
