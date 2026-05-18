import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SessionList } from "./session-list";

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockRefresh = vi.fn();
let searchParams = new URLSearchParams();
vi.mock("@/hooks/use-transition-router", () => ({
  useTransitionRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
  }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
  }),
  useSearchParams: () => searchParams,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: { id: "user-1" } } }),
    },
    rpc: vi.fn().mockResolvedValue({ error: null }),
    from: () => ({
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnThis(),
      single: vi
        .fn()
        .mockResolvedValue({ data: { id: "new-session" }, error: null }),
    }),
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), loading: vi.fn() },
}));

const mockSession = {
  id: "session-1",
  title: "The Siege of Ironhold",
  date_played: "2026-05-18",
  session_number: 1,
  raw_notes: null,
  ai_summary: null,
  gm_notes: null,
  player_summary: null,
  player_visible: false,
  status: "draft",
  created_by: "user-1",
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
  beforeEach(() => {
    vi.clearAllMocks();
    searchParams = new URLSearchParams();
  });

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
      screen.getAllByText(/the siege of ironhold/i).length
    ).toBeGreaterThanOrEqual(1);
  });

  it("shows empty state when no sessions", () => {
    render(<SessionList {...defaultProps} sessions={[]} />);
    expect(screen.getByText(/no sessions yet/i)).toBeInTheDocument();
  });

  it("hides draft sessions from players", () => {
    render(<SessionList {...defaultProps} role="player" />);
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
});
