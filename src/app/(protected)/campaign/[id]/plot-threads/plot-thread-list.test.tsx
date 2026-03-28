import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlotThreadList } from "./plot-thread-list";
import { mockPlotThreads } from "@/test/mocks";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
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

  // ─── Rendering ────────────────────────────────────────────

  it("renders the page heading", () => {
    render(<PlotThreadList {...defaultProps} />);
    expect(screen.getByText("Plot Threads")).toBeInTheDocument();
  });

  it("renders plot thread count", () => {
    render(<PlotThreadList {...defaultProps} />);
    expect(screen.getByText(/3 thread/i)).toBeInTheDocument();
  });

  it("renders plot thread titles", () => {
    render(<PlotThreadList {...defaultProps} />);
    expect(screen.getByText("The Crimson Conspiracy")).toBeInTheDocument();
    expect(screen.getByText("The Missing Miners")).toBeInTheDocument();
    expect(screen.getByText("The Dragon's Debt")).toBeInTheDocument();
  });

  it("renders status badges", () => {
    render(<PlotThreadList {...defaultProps} />);
    expect(screen.getAllByText("active").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("on_hold")).toBeInTheDocument();
  });

  it("renders priority badges", () => {
    render(<PlotThreadList {...defaultProps} />);
    expect(screen.getByText("main")).toBeInTheDocument();
    expect(screen.getByText("side")).toBeInTheDocument();
    expect(screen.getByText("background")).toBeInTheDocument();
  });

  it("renders descriptions", () => {
    render(<PlotThreadList {...defaultProps} />);
    expect(screen.getByText(/secretly infiltrating/)).toBeInTheDocument();
  });

  it("shows gm_only indicator", () => {
    render(<PlotThreadList {...defaultProps} />);
    expect(screen.getAllByText(/gm only/i).length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty state when no threads", () => {
    render(<PlotThreadList {...defaultProps} plotThreads={[]} />);
    expect(screen.getByText(/no plot threads yet/i)).toBeInTheDocument();
  });

  // ─── Filtering ────────────────────────────────────────────

  it("can filter by status", () => {
    render(<PlotThreadList {...defaultProps} />);
    // Status filter buttons should exist
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  // ─── Create ───────────────────────────────────────────────

  it("shows create button for GMs", () => {
    render(<PlotThreadList {...defaultProps} />);
    expect(screen.getByText(/new thread/i)).toBeInTheDocument();
  });

  it("hides create button for players", () => {
    render(<PlotThreadList {...defaultProps} role="player" />);
    expect(screen.queryByText(/new thread/i)).not.toBeInTheDocument();
  });

  it("opens create dialog when button is clicked", async () => {
    const user = userEvent.setup();
    render(<PlotThreadList {...defaultProps} />);
    await user.click(screen.getByText(/new thread/i));
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
  });

  // ─── Navigation ───────────────────────────────────────────

  it("has a back button to campaign page", () => {
    render(<PlotThreadList {...defaultProps} />);
    expect(screen.getByText(/test campaign/i)).toBeInTheDocument();
  });
});
