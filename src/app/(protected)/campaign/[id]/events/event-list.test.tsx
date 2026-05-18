import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { EventList } from "./event-list";
import { mockEvents, mockSessions } from "@/test/mocks";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("@/hooks/use-transition-router", () => ({
  useTransitionRouter: () => ({ push: mockPush, refresh: mockRefresh }),
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
  beforeEach(() => vi.clearAllMocks());

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
});
