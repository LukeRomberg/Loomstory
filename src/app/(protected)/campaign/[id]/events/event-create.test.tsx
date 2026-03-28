import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventCreate } from "./event-create";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: "new-event" }, error: null }),
    }),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const defaultProps = {
  campaignId: "campaign-1",
  userId: "user-1",
  sessions: [
    { id: "session-1", title: "The Siege of Ironhold", session_number: 1 },
  ],
  open: true,
  onOpenChange: vi.fn(),
  onCreated: vi.fn(),
};

describe("EventCreate", () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── Form Rendering (EVT-04) ──────────────────────────────

  it("renders dialog title", () => {
    render(<EventCreate {...defaultProps} />);
    expect(screen.getByText(/new event/i)).toBeInTheDocument();
  });

  it("renders content textarea", () => {
    render(<EventCreate {...defaultProps} />);
    expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
  });

  it("renders summary input", () => {
    render(<EventCreate {...defaultProps} />);
    expect(screen.getByLabelText(/summary/i)).toBeInTheDocument();
  });

  it("renders event type dropdown", () => {
    render(<EventCreate {...defaultProps} />);
    expect(screen.getByText(/type/i)).toBeInTheDocument();
  });

  it("renders weight input (1-7)", () => {
    render(<EventCreate {...defaultProps} />);
    expect(screen.getByLabelText(/weight/i)).toBeInTheDocument();
  });

  it("renders narrative day input", () => {
    render(<EventCreate {...defaultProps} />);
    expect(screen.getByLabelText(/narrative day/i)).toBeInTheDocument();
  });

  it("renders time of day dropdown", () => {
    render(<EventCreate {...defaultProps} />);
    expect(screen.getByText(/time of day/i)).toBeInTheDocument();
  });

  it("renders session selector", () => {
    render(<EventCreate {...defaultProps} />);
    expect(screen.getByText(/link to session/i)).toBeInTheDocument();
  });

  it("renders trigger condition input", () => {
    render(<EventCreate {...defaultProps} />);
    expect(screen.getByLabelText(/trigger/i)).toBeInTheDocument();
  });

  // ─── Submission ───────────────────────────────────────────

  it("requires content to submit", () => {
    render(<EventCreate {...defaultProps} />);
    const submitBtn = screen.getByText(/create event/i);
    expect(submitBtn.closest("button")).toBeDisabled();
  });

  it("calls onCreated after successful submit", async () => {
    const user = userEvent.setup();
    render(<EventCreate {...defaultProps} />);
    await user.type(screen.getByLabelText(/content/i), "The party found a secret door.");
    await user.click(screen.getByText(/create event/i));
    expect(defaultProps.onCreated).toHaveBeenCalled();
  });
});
