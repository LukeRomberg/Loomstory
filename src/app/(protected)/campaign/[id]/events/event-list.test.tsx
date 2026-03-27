import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventList } from "./event-list";
import { mockEvents, mockSessions } from "@/test/mocks";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}));

const defaultProps = {
  campaignId: "campaign-1",
  campaignName: "Test Campaign",
  events: mockEvents,
  sessions: mockSessions,
  role: "gm",
};

describe("EventList", () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── Rendering (EVT-01) ───────────────────────────────────

  it("renders the page heading", () => {
    render(<EventList {...defaultProps} />);
    expect(screen.getByText("Events")).toBeInTheDocument();
  });

  it("renders event count", () => {
    render(<EventList {...defaultProps} />);
    expect(screen.getByText(/3 event/i)).toBeInTheDocument();
  });

  it("renders events in a list", () => {
    render(<EventList {...defaultProps} />);
    expect(screen.getByText(/party arrives at ironhold/i)).toBeInTheDocument();
    expect(screen.getByText(/gareth's promise/i)).toBeInTheDocument();
    expect(screen.getByText(/mayor assassinated/i)).toBeInTheDocument();
  });

  it("shows empty state when no events", () => {
    render(<EventList {...defaultProps} events={[]} />);
    expect(screen.getByText(/no events yet/i)).toBeInTheDocument();
  });

  // ─── Event Display (EVT-02) ───────────────────────────────

  it("renders event type badges on event cards", () => {
    render(<EventList {...defaultProps} />);
    // Type names appear as both filter buttons and event badges — use getAllByText
    expect(screen.getAllByText("scene").length).toBeGreaterThanOrEqual(2); // filter + badge
    expect(screen.getAllByText("promise").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("milestone").length).toBeGreaterThanOrEqual(2);
  });

  it("renders event weight badges", () => {
    render(<EventList {...defaultProps} />);
    expect(screen.getByText("w3")).toBeInTheDocument();
    expect(screen.getByText("w4")).toBeInTheDocument();
    expect(screen.getByText("w5")).toBeInTheDocument();
  });

  it("shows resolved badge for resolved events", () => {
    render(<EventList {...defaultProps} />);
    expect(screen.getByText(/resolved/i)).toBeInTheDocument();
  });

  it("shows trigger condition for promises and upcoming events", () => {
    render(<EventList {...defaultProps} />);
    expect(screen.getByText(/clears the bandit camp/i)).toBeInTheDocument();
  });

  it("renders event content or summary", () => {
    render(<EventList {...defaultProps} />);
    expect(screen.getByText(/party arrives at ironhold/i)).toBeInTheDocument();
  });

  it("shows narrative day when present", () => {
    render(<EventList {...defaultProps} />);
    // Multiple events can have Day 1
    expect(screen.getAllByText(/Day 1/).length).toBeGreaterThanOrEqual(1);
  });

  it("shows time of day as friendly label when present", () => {
    render(<EventList {...defaultProps} />);
    // 900 = Morning, 1200 = Midday
    expect(screen.getByText(/morning/i)).toBeInTheDocument();
  });

  // ─── Session Filter (EVT-03) ──────────────────────────────

  it("renders session filter dropdown", () => {
    render(<EventList {...defaultProps} />);
    expect(screen.getByText(/all sessions/i)).toBeInTheDocument();
  });

  it("shows session names in the filter", async () => {
    const user = userEvent.setup();
    render(<EventList {...defaultProps} />);
    await user.click(screen.getByText(/all sessions/i));
    // Session title appears in both the dropdown and as an event badge
    expect(screen.getAllByText("The Siege of Ironhold").length).toBeGreaterThanOrEqual(1);
  });

  it("filters events by session when selected", async () => {
    const user = userEvent.setup();
    render(<EventList {...defaultProps} />);
    await user.click(screen.getByText(/all sessions/i));
    // Click the session option in the dropdown (use getAllByText and pick the listbox one)
    const options = screen.getAllByText("The Siege of Ironhold");
    const selectOption = options.find((el) => el.closest("[role='option']"));
    if (selectOption) await user.click(selectOption);
    // Session-1 events should show, session-null event should hide
    expect(screen.getByText(/party arrives at ironhold/i)).toBeInTheDocument();
    expect(screen.queryByText(/mayor assassinated/i)).not.toBeInTheDocument();
  });

  // ─── Navigation ───────────────────────────────────────────

  it("has a back button to campaign page", () => {
    render(<EventList {...defaultProps} />);
    expect(screen.getByText(/test campaign/i)).toBeInTheDocument();
  });

  // ─── Type Filter ──────────────────────────────────────────

  it("renders event type filter buttons", () => {
    render(<EventList {...defaultProps} />);
    // "all" filter button exists
    const allButtons = screen.getAllByRole("button").filter(
      (b) => b.textContent?.toLowerCase() === "all"
    );
    expect(allButtons.length).toBeGreaterThanOrEqual(1);
  });
});
