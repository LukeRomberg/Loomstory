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
};

describe("ConversationList", () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── Rendering (CONV-01) ──────────────────────────────────

  it("renders the page heading", () => {
    render(<ConversationList {...defaultProps} />);
    expect(screen.getByText("Conversations")).toBeInTheDocument();
  });

  it("renders conversation count", () => {
    render(<ConversationList {...defaultProps} />);
    expect(screen.getByText(/2 conversation/i)).toBeInTheDocument();
  });

  it("renders conversation titles", () => {
    render(<ConversationList {...defaultProps} />);
    expect(screen.getByText("Gareth warns the party")).toBeInTheDocument();
    expect(screen.getByText("Negotiating passage at the gate")).toBeInTheDocument();
  });

  it("shows empty state when no conversations", () => {
    render(<ConversationList {...defaultProps} conversations={[]} />);
    expect(screen.getByText(/no conversations yet/i)).toBeInTheDocument();
  });

  // ─── Speaker Attribution (CONV-01) ────────────────────────

  it("renders participant names", () => {
    render(<ConversationList {...defaultProps} />);
    expect(screen.getAllByText(/Gareth/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Durk/).length).toBeGreaterThanOrEqual(1);
  });

  it("renders dialogue turns with speaker names", () => {
    render(<ConversationList {...defaultProps} />);
    expect(screen.getByText(/Crimson Hand has eyes everywhere/)).toBeInTheDocument();
  });

  it("renders tone tags on dialogue turns", () => {
    render(<ConversationList {...defaultProps} />);
    expect(screen.getByText("nervous")).toBeInTheDocument();
  });

  // ─── Expandable Detail ────────────────────────────────────

  it("shows conversation preview (first 2 turns) by default", () => {
    render(<ConversationList {...defaultProps} />);
    // First conversation has 3 turns, should show preview of first 2
    expect(screen.getByText(/Crimson Hand has eyes everywhere/)).toBeInTheDocument();
    expect(screen.getByText(/faced worse/)).toBeInTheDocument();
  });

  it("shows expand button when conversation has more than 2 turns", () => {
    render(<ConversationList {...defaultProps} />);
    expect(screen.getAllByText(/more/i).length).toBeGreaterThanOrEqual(1);
  });

  it("expands to show all turns when clicked", async () => {
    const user = userEvent.setup();
    render(<ConversationList {...defaultProps} />);
    const expandBtns = screen.getAllByText(/more/i);
    await user.click(expandBtns[0]);
    // Now the third turn should be visible
    expect(screen.getByText(/the Veil/i)).toBeInTheDocument();
  });

  // ─── GM Notes ─────────────────────────────────────────────

  it("shows GM notes for conversations that have them", () => {
    render(<ConversationList {...defaultProps} />);
    expect(screen.getByText(/Gareth is lying/i)).toBeInTheDocument();
  });

  it("hides GM notes for players", () => {
    render(<ConversationList {...defaultProps} role="player" />);
    expect(screen.queryByText(/Gareth is lying/i)).not.toBeInTheDocument();
  });

  // ─── Session Filter ───────────────────────────────────────

  it("renders session filter dropdown", () => {
    render(<ConversationList {...defaultProps} />);
    expect(screen.getByText(/all sessions/i)).toBeInTheDocument();
  });

  // ─── Participant Search ───────────────────────────────────

  it("renders search input for filtering by participant", () => {
    render(<ConversationList {...defaultProps} />);
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it("filters conversations by participant name", async () => {
    const user = userEvent.setup();
    render(<ConversationList {...defaultProps} />);
    await user.type(screen.getByPlaceholderText(/search/i), "Hale");
    // Only the gate conversation should show
    expect(screen.queryByText("Gareth warns the party")).not.toBeInTheDocument();
    expect(screen.getByText("Negotiating passage at the gate")).toBeInTheDocument();
  });

  // ─── Navigation ───────────────────────────────────────────

  it("has a back button to campaign page", () => {
    render(<ConversationList {...defaultProps} />);
    expect(screen.getByText(/test campaign/i)).toBeInTheDocument();
  });
});
