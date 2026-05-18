import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlotThreadList } from "./plot-thread-list";
import { mockPlotThreads } from "@/test/mocks";

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
      single: vi.fn().mockResolvedValue({ data: { id: "new-thread" }, error: null }),
    }),
  }),
}));

const defaultProps = {
  campaignId: "campaign-1",
  campaignName: "Test Campaign",
  plotThreads: mockPlotThreads,
  role: "gm",
  userId: "user-1",
};

describe("PlotThreadList", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the page heading", () => {
    render(<PlotThreadList {...defaultProps} />);
    expect(screen.getByText(/plot threads/i)).toBeInTheDocument();
  });

  it("renders the count in the heading", () => {
    render(<PlotThreadList {...defaultProps} />);
    expect(
      screen.getByText(`(${mockPlotThreads.length})`)
    ).toBeInTheDocument();
  });

  it("renders thread titles in the master list", () => {
    render(<PlotThreadList {...defaultProps} />);
    for (const t of mockPlotThreads) {
      expect(screen.getAllByText(t.title).length).toBeGreaterThanOrEqual(1);
    }
  });

  it("shows empty state when no threads", () => {
    render(<PlotThreadList {...defaultProps} plotThreads={[]} />);
    expect(screen.getByText(/no plot threads yet/i)).toBeInTheDocument();
  });

  it("shows the new-thread overlay for GMs", () => {
    render(<PlotThreadList {...defaultProps} />);
    expect(screen.getByLabelText(/new plot thread/i)).toBeInTheDocument();
  });

  it("hides the new-thread overlay for players", () => {
    render(<PlotThreadList {...defaultProps} role="player" />);
    expect(screen.queryByLabelText(/new plot thread/i)).not.toBeInTheDocument();
  });

  it("renders a back link to the bookshelf", () => {
    render(<PlotThreadList {...defaultProps} />);
    expect(screen.getByLabelText(/back to bookshelf/i)).toBeInTheDocument();
  });
});
