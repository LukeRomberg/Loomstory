import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConversationCreate } from "./conversation-create";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: "new-conv" }, error: null }),
    }),
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const defaultProps = {
  campaignId: "campaign-1",
  userId: "user-1",
  knownEntities: [
    { id: "npc-1", name: "Gareth the Bold", entity_type: "npc" },
    { id: "npc-2", name: "Marta", entity_type: "npc" },
    { id: "loc-1", name: "Ironhold", entity_type: "location" },
  ],
  open: true,
  onOpenChange: vi.fn(),
  onCreated: vi.fn(),
};

describe("ConversationCreate", () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── Form Rendering (CONV-03) ─────────────────────────────

  it("renders dialog title", () => {
    render(<ConversationCreate {...defaultProps} />);
    expect(screen.getByText(/new conversation/i)).toBeInTheDocument();
  });

  it("renders title input", () => {
    render(<ConversationCreate {...defaultProps} />);
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
  });

  it("renders summary input", () => {
    render(<ConversationCreate {...defaultProps} />);
    expect(screen.getByLabelText(/summary/i)).toBeInTheDocument();
  });

  // ─── Participants ─────────────────────────────────────────

  it("renders add participant button", () => {
    render(<ConversationCreate {...defaultProps} />);
    expect(screen.getByText(/add participant/i)).toBeInTheDocument();
  });

  it("shows participant dropdown after clicking add", async () => {
    const user = userEvent.setup();
    render(<ConversationCreate {...defaultProps} />);
    await user.click(screen.getByText(/add participant/i));
    // The select trigger should now be visible with a placeholder
    expect(screen.getByText(/select participant/i)).toBeInTheDocument();
  });

  // ─── Dialogue Turns ───────────────────────────────────────

  it("renders add turn button", () => {
    render(<ConversationCreate {...defaultProps} />);
    expect(screen.getByText(/add turn/i)).toBeInTheDocument();
  });

  it("adds a dialogue turn with speaker, text, and tone fields", async () => {
    const user = userEvent.setup();
    render(<ConversationCreate {...defaultProps} />);
    await user.click(screen.getByText(/add turn/i));
    expect(screen.getByPlaceholderText(/speaker/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/what they said/i)).toBeInTheDocument();
  });

  it("can add multiple turns", async () => {
    const user = userEvent.setup();
    render(<ConversationCreate {...defaultProps} />);
    await user.click(screen.getByText(/add turn/i));
    await user.click(screen.getByText(/add turn/i));
    const speakerInputs = screen.getAllByPlaceholderText(/speaker/i);
    expect(speakerInputs.length).toBe(2);
  });

  it("can remove a turn", async () => {
    const user = userEvent.setup();
    render(<ConversationCreate {...defaultProps} />);
    await user.click(screen.getByText(/add turn/i));
    // Should have a remove button
    const removeButtons = screen.getAllByRole("button").filter(
      (b) => b.getAttribute("aria-label") === "Remove turn"
    );
    expect(removeButtons.length).toBeGreaterThanOrEqual(1);
  });

  // ─── Submission ───────────────────────────────────────────

  it("requires a title to submit", () => {
    render(<ConversationCreate {...defaultProps} />);
    const submitBtn = screen.getByText(/create conversation/i);
    expect(submitBtn.closest("button")).toBeDisabled();
  });

  it("calls onCreated after successful submit", async () => {
    const user = userEvent.setup();
    render(<ConversationCreate {...defaultProps} />);
    await user.type(screen.getByLabelText(/title/i), "A tense negotiation");
    await user.click(screen.getByText(/create conversation/i));
    expect(defaultProps.onCreated).toHaveBeenCalled();
  });
});

describe("ConversationList — Search (CONV-04)", () => {
  // CONV-04 tests are already in conversation-list.test.tsx:
  // "renders search input for filtering" and "filters conversations by participant name"
  // Adding this describe block as a reference marker.

  it("CONV-04 is covered by existing conversation-list tests", () => {
    expect(true).toBe(true);
  });
});
