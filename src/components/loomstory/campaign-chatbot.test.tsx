import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CampaignChatbot } from "./campaign-chatbot";

const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), loading: vi.fn() },
}));

const defaultProps = {
  campaignId: "campaign-1",
  userId: "user-1",
  role: "gm",
};

describe("CampaignChatbot — Bubble & Toggle", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders as a floating bubble button by default", () => {
    render(<CampaignChatbot {...defaultProps} />);
    expect(screen.getByRole("button", { name: /open chat/i })).toBeInTheDocument();
  });

  it("chat panel is hidden by default", () => {
    const { container } = render(<CampaignChatbot {...defaultProps} />);
    const panel = container.querySelector("[hidden]");
    expect(panel).toBeTruthy();
  });

  it("opens chat panel when bubble is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(<CampaignChatbot {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /open chat/i }));
    const panel = container.querySelector("[hidden]");
    expect(panel).toBeNull(); // no hidden panel = it's visible
  });

  it("minimizes back to bubble when close is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(<CampaignChatbot {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /open chat/i }));
    await user.click(screen.getByRole("button", { name: /minimize/i }));
    const panel = container.querySelector("[hidden]");
    expect(panel).toBeTruthy(); // panel hidden again
    expect(screen.getByRole("button", { name: /open chat/i })).toBeInTheDocument();
  });

  it("preserves chat history when minimized and reopened", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ answer: "The guild operates in secret.", sources: [] }),
    });
    const user = userEvent.setup();
    render(<CampaignChatbot {...defaultProps} />);

    // Open and ask
    await user.click(screen.getByRole("button", { name: /open chat/i }));
    const input = screen.getByPlaceholderText(/ask a question/i);
    await user.type(input, "Tell me about the guild");
    const submitButtons = screen.getAllByRole("button");
    const sendBtn = submitButtons.find((b) => b.querySelector('[class*="send"]') || (b as HTMLButtonElement).type === "submit");
    if (sendBtn) await user.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText(/operates in secret/i)).toBeInTheDocument();
    });

    // Minimize
    await user.click(screen.getByRole("button", { name: /minimize/i }));

    // Reopen
    await user.click(screen.getByRole("button", { name: /open chat/i }));
    expect(screen.getByText(/operates in secret/i)).toBeInTheDocument();
  });
});

describe("CampaignChatbot — Chat (AI-01)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        answer: "The Crimson Hand is a shadowy guild of assassins.",
        sources: [
          { entity_type: "faction", entity_id: "faction-1", name: "The Crimson Hand", chunk: "A shadowy guild..." },
        ],
      }),
    });
  });

  it("sends question to API on submit", async () => {
    const user = userEvent.setup();
    render(<CampaignChatbot {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /open chat/i }));
    await user.type(screen.getByPlaceholderText(/ask a question/i), "What about the Crimson Hand?");
    // Submit via Enter key
    await user.keyboard("{Enter}");
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/ai-query",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  it("displays the AI answer", async () => {
    const user = userEvent.setup();
    render(<CampaignChatbot {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /open chat/i }));
    await user.type(screen.getByPlaceholderText(/ask a question/i), "Crimson Hand?");
    await user.keyboard("{Enter}");
    await waitFor(() => {
      expect(screen.getByText(/shadowy guild of assassins/i)).toBeInTheDocument();
    });
  });

  it("shows loading state while waiting", async () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    render(<CampaignChatbot {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /open chat/i }));
    await user.type(screen.getByPlaceholderText(/ask a question/i), "Question");
    await user.keyboard("{Enter}");
    expect(screen.getByText(/thinking/i)).toBeInTheDocument();
  });

  it("disables submit when input is empty", async () => {
    const user = userEvent.setup();
    render(<CampaignChatbot {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /open chat/i }));
    // Find the send button (type=submit)
    const form = screen.getByPlaceholderText(/ask a question/i).closest("form");
    const submitBtn = form?.querySelector("button[type='submit']");
    expect(submitBtn).toBeDisabled();
  });
});

describe("CampaignChatbot — Sources (AI-02)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        answer: "Answer here.",
        sources: [
          { entity_type: "faction", entity_id: "faction-1", name: "The Crimson Hand", chunk: "text..." },
          { entity_type: "npc", entity_id: "npc-1", name: "Gareth the Bold", chunk: "text..." },
        ],
      }),
    });
  });

  it("shows source entities", async () => {
    const user = userEvent.setup();
    render(<CampaignChatbot {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /open chat/i }));
    await user.type(screen.getByPlaceholderText(/ask a question/i), "Question");
    await user.keyboard("{Enter}");
    await waitFor(() => {
      expect(screen.getByText("The Crimson Hand")).toBeInTheDocument();
      expect(screen.getByText("Gareth the Bold")).toBeInTheDocument();
    });
  });

  it("shows entity type badges on sources", async () => {
    const user = userEvent.setup();
    render(<CampaignChatbot {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /open chat/i }));
    await user.type(screen.getByPlaceholderText(/ask a question/i), "Question");
    await user.keyboard("{Enter}");
    await waitFor(() => {
      expect(screen.getByText("faction")).toBeInTheDocument();
    });
  });
});

describe("CampaignChatbot — Save (AI-04)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ answer: "Saveable answer.", sources: [] }),
    });
  });

  it("shows save button on AI responses", async () => {
    const user = userEvent.setup();
    render(<CampaignChatbot {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /open chat/i }));
    await user.type(screen.getByPlaceholderText(/ask a question/i), "Question");
    await user.keyboard("{Enter}");
    await waitFor(() => {
      // Find button with Save text (not just any text containing "save")
      const saveButtons = screen.getAllByRole("button").filter(
        (b) => b.textContent?.trim() === "Save"
      );
      expect(saveButtons.length).toBeGreaterThanOrEqual(1);
    });
  });
});
