import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventList } from "./event-list";
import { mockEvents, mockSessions } from "@/test/mocks";

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
      single: vi.fn().mockResolvedValue({
        data: { id: "new-event" },
        error: null,
      }),
    }),
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), loading: vi.fn() },
}));

const defaultProps = {
  campaignId: "campaign-1",
  campaignName: "Test Campaign",
  events: mockEvents,
  sessions: mockSessions,
  role: "gm",
  userId: "test-user-id",
};

describe("EventList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParams = new URLSearchParams();
  });

  it("renders the page heading", () => {
    render(<EventList {...defaultProps} />);
    expect(screen.getByText(/events/i)).toBeInTheDocument();
  });

  it("renders the count in the heading", () => {
    render(<EventList {...defaultProps} />);
    expect(screen.getByText(`(${mockEvents.length})`)).toBeInTheDocument();
  });

  it("shows empty state when no events", () => {
    render(<EventList {...defaultProps} events={[]} />);
    expect(screen.getByText(/no events yet/i)).toBeInTheDocument();
  });

  it("shows the new-event overlay for GMs", () => {
    render(<EventList {...defaultProps} />);
    expect(screen.getByLabelText(/new event/i)).toBeInTheDocument();
  });

  it("hides the new-event overlay for players", () => {
    render(<EventList {...defaultProps} role="player" />);
    expect(screen.queryByLabelText(/new event/i)).not.toBeInTheDocument();
  });

  it("renders a back link to the bookshelf", () => {
    render(<EventList {...defaultProps} />);
    expect(screen.getByLabelText(/back to bookshelf/i)).toBeInTheDocument();
  });

  // ─── Inline detail panel ─────────────────────────────────

  it("renders selected event's content inline by default (first event)", () => {
    render(<EventList {...defaultProps} />);
    expect(screen.getByText(/party arrived at ironhold/i)).toBeInTheDocument();
  });

  it("shows inline Edit affordance for GMs", () => {
    render(<EventList {...defaultProps} />);
    expect(screen.getAllByText(/edit/i).length).toBeGreaterThanOrEqual(1);
  });

  it("hides inline Edit affordance for players", () => {
    render(<EventList {...defaultProps} role="player" />);
    expect(screen.queryByText(/^edit$/i)).not.toBeInTheDocument();
  });

  // ─── URL ?selected param ─────────────────────────────────

  it("selects event matching ?selected URL param on mount", () => {
    searchParams = new URLSearchParams("selected=event-2");
    render(<EventList {...defaultProps} />);
    // event-2's content (not its summary) appears only in the right-page detail
    expect(
      screen.getByText(/gareth promised to provide safe passage/i)
    ).toBeInTheDocument();
  });

  it("updates URL ?selected when switching selection in master list", async () => {
    const user = userEvent.setup();
    render(<EventList {...defaultProps} />);
    // Click event-2 summary text in the master list
    const allMatches = screen.getAllByText(/promise of safe passage/i);
    await user.click(allMatches[0]);
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringMatching(/[?&]selected=event-2(&|$)/)
    );
  });
});
