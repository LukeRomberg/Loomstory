import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConversationList } from "./conversation-list";
import { mockConversations, mockSessions } from "@/test/mocks";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}));

const defaultProps = {
  campaignId: "campaign-1",
  campaignName: "Test Campaign",
  conversations: mockConversations,
  sessions: mockSessions,
  role: "gm",
  userId: "user-1",
  knownEntities: [
    { id: "npc-1", name: "Gareth the Bold", entity_type: "npc" },
    { id: "npc-2", name: "Gate Captain Hale", entity_type: "npc" },
  ],
};

describe("ConversationList", () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── Rendering ────────────────────────────────────────────

  it("renders the page heading", () => {
    render(<ConversationList {...defaultProps} />);
    expect(screen.getByText(/conversations/i)).toBeInTheDocument();
  });

  it("renders conversation count in the heading", () => {
    render(<ConversationList {...defaultProps} />);
    // Heading reads "Conversations (2)"
    expect(screen.getByText("(2)")).toBeInTheDocument();
  });

  it("renders conversation titles in the master list", () => {
    render(<ConversationList {...defaultProps} />);
    // First conversation auto-selects so its title appears in both master + detail
    expect(
      screen.getAllByText("Gareth warns the party").length
    ).toBeGreaterThanOrEqual(1);
    // Second conversation appears in master list only
    expect(screen.getByText("Negotiating passage at the gate")).toBeInTheDocument();
  });

  it("shows empty state when no conversations", () => {
    render(<ConversationList {...defaultProps} conversations={[]} />);
    expect(screen.getByText(/no conversations yet/i)).toBeInTheDocument();
  });

  // ─── Detail Pane (auto-selects first conversation) ────────

  it("auto-selects the first conversation and renders its participants", () => {
    render(<ConversationList {...defaultProps} />);
    expect(screen.getAllByText(/Gareth/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Durk/).length).toBeGreaterThanOrEqual(1);
  });

  it("renders all dialogue turns of the selected conversation in the detail pane", () => {
    render(<ConversationList {...defaultProps} />);
    expect(screen.getByText(/Crimson Hand has eyes everywhere/)).toBeInTheDocument();
    expect(screen.getByText(/the Veil/i)).toBeInTheDocument();
  });

  it("renders tone tags on dialogue turns", () => {
    render(<ConversationList {...defaultProps} />);
    expect(screen.getByText("nervous")).toBeInTheDocument();
  });

  it("changes the detail pane when a different conversation is clicked", async () => {
    const user = userEvent.setup();
    render(<ConversationList {...defaultProps} />);
    // Click the second conversation in the master list
    const masterItem = screen
      .getAllByText("Negotiating passage at the gate")[0]
      .closest("button");
    expect(masterItem).not.toBeNull();
    await user.click(masterItem!);
    // Now its title also shows in the detail pane (multiple occurrences)
    expect(
      screen.getAllByText("Negotiating passage at the gate").length
    ).toBeGreaterThanOrEqual(2);
  });

  // ─── GM Notes ─────────────────────────────────────────────

  it("shows GM notes for conversations that have them (GM view, selected)", () => {
    render(<ConversationList {...defaultProps} />);
    expect(screen.getByText(/Gareth is lying/i)).toBeInTheDocument();
  });

  it("hides GM notes for players", () => {
    render(<ConversationList {...defaultProps} role="player" />);
    expect(screen.queryByText(/Gareth is lying/i)).not.toBeInTheDocument();
  });

  // ─── Filters ──────────────────────────────────────────────

  it("renders session filter dropdown", () => {
    render(<ConversationList {...defaultProps} />);
    expect(screen.getByText(/all sessions/i)).toBeInTheDocument();
  });

  it("renders search input", () => {
    render(<ConversationList {...defaultProps} />);
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it("filters conversations in the master list by participant name", async () => {
    const user = userEvent.setup();
    render(<ConversationList {...defaultProps} />);
    await user.type(screen.getByPlaceholderText(/search/i), "Hale");
    // Gareth conversation should no longer be in the master list
    expect(screen.queryByText("Gareth warns the party")).not.toBeInTheDocument();
    // Negotiating conversation should still show (and is auto-selected now)
    expect(
      screen.getAllByText("Negotiating passage at the gate").length
    ).toBeGreaterThanOrEqual(1);
  });

  // ─── Navigation ───────────────────────────────────────────

  it("renders a back link to the bookshelf", () => {
    render(<ConversationList {...defaultProps} />);
    expect(screen.getByLabelText(/back to bookshelf/i)).toBeInTheDocument();
  });
});
