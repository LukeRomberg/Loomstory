import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SessionList } from "./session-list";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("@/hooks/use-transition-router", () => ({
  useTransitionRouter: () => ({ push: mockPush, refresh: mockRefresh }),
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

const mockSession = {
  id: "session-1",
  title: "The Siege of Ironhold",
  date_played: "2026-05-18",
  session_number: 1,
  status: "draft",
  created_at: "2026-05-18T00:00:00Z",
};

const defaultProps = {
  campaignId: "campaign-1",
  campaignName: "Test Campaign",
  sessions: [mockSession],
  role: "gm",
  userId: "user-1",
};

describe("SessionList", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the page heading", () => {
    render(<SessionList {...defaultProps} />);
    expect(screen.getByText(/sessions/i)).toBeInTheDocument();
  });

  it("renders the count in the heading", () => {
    render(<SessionList {...defaultProps} />);
    expect(screen.getByText("(1)")).toBeInTheDocument();
  });

  it("renders the session title (master + detail)", () => {
    render(<SessionList {...defaultProps} />);
    expect(
      screen.getAllByText("The Siege of Ironhold").length
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders the session number with a # prefix", () => {
    render(<SessionList {...defaultProps} />);
    expect(screen.getAllByText("#1").length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty state when no sessions", () => {
    render(<SessionList {...defaultProps} sessions={[]} />);
    expect(screen.getByText(/no sessions yet/i)).toBeInTheDocument();
  });

  it("hides draft sessions from players", () => {
    render(<SessionList {...defaultProps} role="player" />);
    // The single mock session is draft, so the count is 0 from a player POV
    expect(screen.getByText("(0)")).toBeInTheDocument();
  });

  it("shows the new-session overlay for GMs", () => {
    render(<SessionList {...defaultProps} />);
    expect(screen.getByLabelText(/new session/i)).toBeInTheDocument();
  });

  it("hides the new-session overlay for players", () => {
    render(<SessionList {...defaultProps} role="player" />);
    expect(screen.queryByLabelText(/new session/i)).not.toBeInTheDocument();
  });

  it("renders a back link to the bookshelf", () => {
    render(<SessionList {...defaultProps} />);
    expect(screen.getByLabelText(/back to bookshelf/i)).toBeInTheDocument();
  });

  it("navigates to the session detail when Open session is clicked", async () => {
    const userEvent = (await import("@testing-library/user-event")).default;
    const user = userEvent.setup();
    render(<SessionList {...defaultProps} />);
    await user.click(screen.getByText(/open session/i));
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringMatching(/^\/campaign\/campaign-1\/session\//)
    );
  });
});
