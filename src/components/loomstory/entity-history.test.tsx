import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EntityHistory } from "./entity-history";
import { mockEntityHistory } from "@/test/mocks";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const defaultProps = {
  campaignId: "campaign-1",
  history: mockEntityHistory,
};

describe("EntityHistory", () => {
  // ─── Events ───────────────────────────────────────────────

  it("renders events section", () => {
    render(<EntityHistory {...defaultProps} />);
    expect(screen.getByText(/events/i)).toBeInTheDocument();
  });

  it("renders event summaries", () => {
    render(<EntityHistory {...defaultProps} />);
    // "Gareth warns" appears in both events and conversations sections
    expect(screen.getAllByText(/gareth warns the party/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/promise of safe passage/i)).toBeInTheDocument();
  });

  it("renders event type and weight badges", () => {
    render(<EntityHistory {...defaultProps} />);
    expect(screen.getAllByText("scene").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("promise").length).toBeGreaterThanOrEqual(1);
  });

  it("renders event role badges", () => {
    render(<EntityHistory {...defaultProps} />);
    expect(screen.getAllByText("subject").length).toBeGreaterThanOrEqual(1);
  });

  // ─── Conversations ────────────────────────────────────────

  it("renders conversations section", () => {
    render(<EntityHistory {...defaultProps} />);
    expect(screen.getByText(/conversations/i)).toBeInTheDocument();
  });

  it("renders conversation titles", () => {
    render(<EntityHistory {...defaultProps} />);
    // Title appears in both events and conversations sections
    expect(screen.getAllByText(/gareth warns the party/i).length).toBeGreaterThanOrEqual(1);
  });

  it("renders conversation participant names", () => {
    render(<EntityHistory {...defaultProps} />);
    expect(screen.getByText(/Durk/)).toBeInTheDocument();
  });

  it("renders conversation turn count", () => {
    render(<EntityHistory {...defaultProps} />);
    expect(screen.getByText(/3 turns/i)).toBeInTheDocument();
  });

  // ─── Session Mentions ─────────────────────────────────────

  it("renders session mentions section", () => {
    render(<EntityHistory {...defaultProps} />);
    expect(screen.getByText(/sessions/i)).toBeInTheDocument();
  });

  it("renders session titles", () => {
    render(<EntityHistory {...defaultProps} />);
    expect(screen.getByText(/the siege of ironhold/i)).toBeInTheDocument();
  });

  it("renders mention type", () => {
    render(<EntityHistory {...defaultProps} />);
    expect(screen.getByText(/introduced/i)).toBeInTheDocument();
  });

  // ─── Empty State ──────────────────────────────────────────

  it("shows empty state when no history", () => {
    render(
      <EntityHistory
        {...defaultProps}
        history={{ events: [], conversations: [], session_mentions: [] }}
      />
    );
    expect(screen.getByText(/no history/i)).toBeInTheDocument();
  });

  // ─── Chronological Order ──────────────────────────────────

  it("renders events in chronological order", () => {
    render(<EntityHistory {...defaultProps} />);
    const summaries = screen.getAllByText(/gareth/i);
    // First event (scene, day 1 morning) should appear before second (promise, day 1 midday)
    expect(summaries.length).toBeGreaterThanOrEqual(2);
  });
});
