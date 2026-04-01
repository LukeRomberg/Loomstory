/**
 * PORTAL-01 — Player Session Visibility
 *
 * Tests that players only see published sessions, while GMs see all sessions.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SessionList } from "./session-list";
import { mockSession } from "@/test/mocks";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: "new-session" }, error: null }),
    }),
  }),
}));

const publishedSession = {
  ...mockSession,
  id: "session-pub",
  title: "The Battle of Ironhold",
  status: "published",
  created_at: "2026-03-20T00:00:00Z",
};

const draftSession = {
  ...mockSession,
  id: "session-draft",
  title: "GM Draft Notes",
  status: "draft",
  created_at: "2026-03-21T00:00:00Z",
};

const processingSession = {
  ...mockSession,
  id: "session-proc",
  title: "Processing Session",
  status: "processing",
  created_at: "2026-03-22T00:00:00Z",
};

const allSessions = [publishedSession, draftSession, processingSession];

const defaultProps = {
  campaignId: "campaign-1",
  campaignName: "Test Campaign",
  sessions: allSessions,
  role: "gm",
  userId: "user-1",
};

describe("SessionList", () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── GM sees all sessions ─────────────────────────────

  it("GM sees all sessions regardless of status", () => {
    render(<SessionList {...defaultProps} />);
    expect(screen.getByText("The Battle of Ironhold")).toBeInTheDocument();
    expect(screen.getByText("GM Draft Notes")).toBeInTheDocument();
    expect(screen.getByText("Processing Session")).toBeInTheDocument();
  });

  it("GM sees session status badges", () => {
    render(<SessionList {...defaultProps} />);
    expect(screen.getByText("published")).toBeInTheDocument();
    expect(screen.getByText("draft")).toBeInTheDocument();
    expect(screen.getByText("processing")).toBeInTheDocument();
  });

  it("GM can create new sessions", () => {
    render(<SessionList {...defaultProps} />);
    expect(screen.getByText(/new session/i)).toBeInTheDocument();
  });

  // ─── Player only sees published sessions ──────────────

  it("player only sees published sessions", () => {
    render(<SessionList {...defaultProps} role="player" />);
    expect(screen.getByText("The Battle of Ironhold")).toBeInTheDocument();
    expect(screen.queryByText("GM Draft Notes")).not.toBeInTheDocument();
    expect(screen.queryByText("Processing Session")).not.toBeInTheDocument();
  });

  it("player cannot create new sessions", () => {
    render(<SessionList {...defaultProps} role="player" />);
    expect(screen.queryByText(/new session/i)).not.toBeInTheDocument();
  });

  it("player sees empty state when no published sessions exist", () => {
    const unpublishedOnly = [draftSession, processingSession];
    render(<SessionList {...defaultProps} role="player" sessions={unpublishedOnly} />);
    expect(screen.getByText(/no sessions/i)).toBeInTheDocument();
  });

  // ─── General rendering ────────────────────────────────

  it("renders page heading", () => {
    render(<SessionList {...defaultProps} />);
    expect(screen.getByText("Sessions")).toBeInTheDocument();
  });

  it("renders back link to campaign", () => {
    render(<SessionList {...defaultProps} />);
    expect(screen.getByText(/test campaign/i)).toBeInTheDocument();
  });

  it("shows empty state when no sessions at all", () => {
    render(<SessionList {...defaultProps} sessions={[]} />);
    expect(screen.getByText(/no sessions/i)).toBeInTheDocument();
  });
});
