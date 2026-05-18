import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SessionPanels } from "./session-panels";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const defaultProps = {
  sessionId: "session-1",
  aiSummary: "The party arrived at Ironhold and met Gareth at the gates.",
  gmNotes: "Remember to reveal the Crimson Hand connection next session.",
  playerVisible: false,
  status: "processed" as const,
  role: "gm",
};

describe("SessionPanels — AI Summary (SESS-05)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders AI summary text when present", () => {
    render(<SessionPanels {...defaultProps} />);
    expect(screen.getByText(/party arrived at ironhold/i)).toBeInTheDocument();
  });

  it("shows AI Summary heading", () => {
    render(<SessionPanels {...defaultProps} />);
    expect(screen.getByText("AI Summary")).toBeInTheDocument();
  });

  it("hides AI summary section when empty", () => {
    render(<SessionPanels {...defaultProps} aiSummary={null} />);
    expect(screen.queryByText("AI Summary")).not.toBeInTheDocument();
  });

  it("shows edit button for GMs", () => {
    render(<SessionPanels {...defaultProps} />);
    expect(screen.getByText(/edit summary/i)).toBeInTheDocument();
  });

  it("enters edit mode with textarea when edit is clicked", async () => {
    const user = userEvent.setup();
    render(<SessionPanels {...defaultProps} />);
    await user.click(screen.getByText(/edit summary/i));
    expect(screen.getByDisplayValue(/party arrived at ironhold/i)).toBeInTheDocument();
  });

  it("hides edit button for players", () => {
    render(<SessionPanels {...defaultProps} role="player" />);
    expect(screen.queryByText(/edit summary/i)).not.toBeInTheDocument();
  });
});

describe("SessionPanels — GM Notes (SESS-06)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders GM notes text", () => {
    render(<SessionPanels {...defaultProps} />);
    expect(screen.getByText(/crimson hand connection/i)).toBeInTheDocument();
  });

  it("shows GM Notes heading", () => {
    render(<SessionPanels {...defaultProps} />);
    expect(screen.getByText("GM Notes")).toBeInTheDocument();
  });

  it("shows GM notes section with placeholder when empty", () => {
    render(<SessionPanels {...defaultProps} gmNotes={null} />);
    expect(screen.getByText("GM Notes")).toBeInTheDocument();
  });

  it("hides GM notes entirely for players", () => {
    render(<SessionPanels {...defaultProps} role="player" />);
    expect(screen.queryByText("GM Notes")).not.toBeInTheDocument();
  });
});

describe("SessionPanels — Publish Toggle (SESS-07, SESS-08)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows Publish button when status is processed", () => {
    render(<SessionPanels {...defaultProps} status="processed" />);
    expect(screen.getByText(/publish/i)).toBeInTheDocument();
  });

  it("shows Unpublish button when published", () => {
    render(<SessionPanels {...defaultProps} status="published" playerVisible={true} />);
    expect(screen.getByText(/unpublish/i)).toBeInTheDocument();
  });

  it("disables publish when status is draft", () => {
    render(<SessionPanels {...defaultProps} status="draft" />);
    const btn = screen.getByText(/publish/i).closest("button");
    expect(btn).toBeDisabled();
  });

  it("hides publish controls for players", () => {
    render(<SessionPanels {...defaultProps} role="player" />);
    expect(screen.queryByText(/publish/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/unpublish/i)).not.toBeInTheDocument();
  });

  it("toggles publish state on click", async () => {
    const user = userEvent.setup();
    render(<SessionPanels {...defaultProps} status="processed" />);
    await user.click(screen.getByText(/publish/i));
    // After clicking, should show "Unpublish"
    expect(screen.getByText(/unpublish/i)).toBeInTheDocument();
  });
});
