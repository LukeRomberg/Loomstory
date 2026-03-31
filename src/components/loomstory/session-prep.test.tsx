import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SessionPrep } from "./session-prep";

// ─── Mocks ────────────────────────────────────────────────

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}));

const mockSupabaseChain = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => mockSupabaseChain,
  }),
}));

// Mock the fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

const defaultProps = {
  campaignId: "campaign-1",
  campaignName: "The Crimson Accord",
  userId: "user-1",
  role: "gm",
  sessions: [
    { id: "session-1", title: "The Siege of Ironhold", session_number: 1 },
    { id: "session-2", title: "Into the Mountains", session_number: 2 },
  ],
};

// Helper: click a tool card by its exact title text
async function clickToolCard(user: ReturnType<typeof userEvent.setup>, title: string) {
  const cardTitles = screen.getAllByText(title);
  const cardTitle = cardTitles[0];
  const card = cardTitle.closest('[data-slot="card"]');
  await user.click(card ?? cardTitle);
}

describe("SessionPrep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ content: "AI-generated prep content" }),
    });
  });

  // ─── Tool Picker (PREP-01 through PREP-07) ───────────────

  it("renders all seven prep tool cards", () => {
    render(<SessionPrep {...defaultProps} />);
    expect(screen.getByText("Unresolved")).toBeInTheDocument();
    expect(screen.getByText("Session Planner")).toBeInTheDocument();
    expect(screen.getByText("Plot Hooks")).toBeInTheDocument();
    expect(screen.getByText("NPC Encounter")).toBeInTheDocument();
    expect(screen.getByText("Encounter Builder")).toBeInTheDocument();
    expect(screen.getByText("Location Dressing")).toBeInTheDocument();
    expect(screen.getByText("Session Outline")).toBeInTheDocument();
  });

  it("renders campaign name and page heading", () => {
    render(<SessionPrep {...defaultProps} />);
    expect(screen.getByText("Session Prep")).toBeInTheDocument();
    expect(screen.getByText("The Crimson Accord")).toBeInTheDocument();
  });

  it("shows tool description when a tool card is selected", async () => {
    const user = userEvent.setup();
    render(<SessionPrep {...defaultProps} />);
    await clickToolCard(user, "Unresolved");
    // Description appears in both the card and the active tool panel — at least 2
    expect(screen.getAllByText(/open promises, todos, and upcoming triggers/i).length).toBeGreaterThanOrEqual(2);
  });

  // ─── PREP-01: Unresolved ─────────────────────────────────

  it("shows generate button for unresolved tool (no input needed)", async () => {
    const user = userEvent.setup();
    render(<SessionPrep {...defaultProps} />);
    await clickToolCard(user, "Unresolved");
    expect(screen.getByRole("button", { name: /generate/i })).toBeInTheDocument();
  });

  it("calls API with tool=unresolved on generate", async () => {
    const user = userEvent.setup();
    render(<SessionPrep {...defaultProps} />);
    await clickToolCard(user, "Unresolved");
    await user.click(screen.getByRole("button", { name: /generate/i }));

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/session-prep",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"tool":"unresolved"'),
      })
    );
  });

  // ─── PREP-02: Session Planner ────────────────────────────

  it("shows textarea input for session planner tool", async () => {
    const user = userEvent.setup();
    render(<SessionPrep {...defaultProps} />);
    await clickToolCard(user, "Session Planner");
    expect(
      screen.getByPlaceholderText(/what are you thinking/i)
    ).toBeInTheDocument();
  });

  it("sends user ideas with planner API call", async () => {
    const user = userEvent.setup();
    render(<SessionPrep {...defaultProps} />);
    await clickToolCard(user, "Session Planner");
    await user.type(
      screen.getByPlaceholderText(/what are you thinking/i),
      "Confront the Crimson Hand"
    );
    await user.click(screen.getByRole("button", { name: /generate/i }));

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/session-prep",
      expect.objectContaining({
        body: expect.stringContaining("Confront the Crimson Hand"),
      })
    );
  });

  // ─── PREP-04: NPC Encounter Planner ─────────────────────

  it("shows scene description input for NPC encounter tool", async () => {
    const user = userEvent.setup();
    render(<SessionPrep {...defaultProps} />);
    await clickToolCard(user, "NPC Encounter");
    expect(
      screen.getByPlaceholderText(/describe the scene/i)
    ).toBeInTheDocument();
  });

  // ─── PREP-05: Encounter Builder ─────────────────────────

  it("shows encounter description input for encounter builder", async () => {
    const user = userEvent.setup();
    render(<SessionPrep {...defaultProps} />);
    await clickToolCard(user, "Encounter Builder");
    expect(
      screen.getByPlaceholderText(/describe the encounter/i)
    ).toBeInTheDocument();
  });

  // ─── PREP-07: Session Outline ───────────────────────────

  it("shows ideas input for session outline tool", async () => {
    const user = userEvent.setup();
    render(<SessionPrep {...defaultProps} />);
    await clickToolCard(user, "Session Outline");
    expect(
      screen.getByPlaceholderText(/theme|idea/i)
    ).toBeInTheDocument();
  });

  // ─── Output Display ─────────────────────────────────────

  it("displays AI-generated content after generation", async () => {
    const user = userEvent.setup();
    render(<SessionPrep {...defaultProps} />);
    await clickToolCard(user, "Unresolved");
    await user.click(screen.getByRole("button", { name: /generate/i }));

    await waitFor(() => {
      expect(screen.getByText("AI-generated prep content")).toBeInTheDocument();
    });
  });

  it("shows loading state while generating", async () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    render(<SessionPrep {...defaultProps} />);
    await clickToolCard(user, "Unresolved");
    await user.click(screen.getByRole("button", { name: /generate/i }));

    expect(screen.getByText(/generating/i)).toBeInTheDocument();
  });

  it("shows error toast on API failure", async () => {
    const { toast } = await import("sonner");
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Server error" }),
    });
    const user = userEvent.setup();
    render(<SessionPrep {...defaultProps} />);
    await clickToolCard(user, "Unresolved");
    await user.click(screen.getByRole("button", { name: /generate/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  // ─── PREP-08: Save to Session ───────────────────────────

  it("shows save button after content is generated", async () => {
    const user = userEvent.setup();
    render(<SessionPrep {...defaultProps} />);
    await clickToolCard(user, "Unresolved");
    await user.click(screen.getByRole("button", { name: /generate/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    });
  });

  it("shows session selector when saving", async () => {
    const user = userEvent.setup();
    render(<SessionPrep {...defaultProps} />);
    await clickToolCard(user, "Unresolved");
    await user.click(screen.getByRole("button", { name: /generate/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/The Siege of Ironhold/)).toBeInTheDocument();
  });

  it("saves generated content to session gm_notes", async () => {
    const user = userEvent.setup();
    render(<SessionPrep {...defaultProps} />);
    await clickToolCard(user, "Unresolved");
    await user.click(screen.getByRole("button", { name: /generate/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(mockSupabaseChain.update).toHaveBeenCalled();
    });
  });

  // ─── Output Editing (PREP-08) ───────────────────────────

  it("allows editing the generated content before saving", async () => {
    const user = userEvent.setup();
    render(<SessionPrep {...defaultProps} />);
    await clickToolCard(user, "Unresolved");
    await user.click(screen.getByRole("button", { name: /generate/i }));

    await waitFor(() => {
      expect(screen.getByText("AI-generated prep content")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /edit/i }));
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveValue("AI-generated prep content");
  });

  // ─── Regenerate ─────────────────────────────────────────

  it("allows regenerating content after initial generation", async () => {
    const user = userEvent.setup();
    render(<SessionPrep {...defaultProps} />);
    await clickToolCard(user, "Unresolved");
    await user.click(screen.getByRole("button", { name: /generate/i }));

    await waitFor(() => {
      expect(screen.getByText("AI-generated prep content")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /regenerate/i })).toBeInTheDocument();
  });

  // ─── Tool Switching ─────────────────────────────────────

  it("clears output when switching to a different tool", async () => {
    const user = userEvent.setup();
    render(<SessionPrep {...defaultProps} />);

    await clickToolCard(user, "Unresolved");
    await user.click(screen.getByRole("button", { name: /generate/i }));

    await waitFor(() => {
      expect(screen.getByText("AI-generated prep content")).toBeInTheDocument();
    });

    await clickToolCard(user, "Session Planner");

    expect(screen.queryByText("AI-generated prep content")).not.toBeInTheDocument();
  });

  // ─── Access Control ─────────────────────────────────────

  it("does not render for non-GM users", () => {
    render(<SessionPrep {...defaultProps} role="player" />);
    expect(screen.queryByText("Session Prep")).not.toBeInTheDocument();
    expect(screen.getByText(/gm only/i)).toBeInTheDocument();
  });
});
