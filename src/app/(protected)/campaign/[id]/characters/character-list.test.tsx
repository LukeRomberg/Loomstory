import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CharacterList } from "./character-list";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "new-char", name: "New Character" },
        error: null,
      }),
    }),
  }),
}));

const mockCharacter = {
  id: "char-1",
  name: "Durk Stonefeld",
  level: 1,
  hp_current: 25,
  hp_max: 25,
  system_id: "system-dnd5e",
  user_id: "player-user-id",
  portrait_url: null,
  data: { race: "Half-Orc", class: "Fighter" },
};

const defaultProps = {
  campaignId: "campaign-1",
  campaignName: "Test Campaign",
  characters: [mockCharacter],
  role: "gm",
  userId: "user-1",
  systemId: "system-dnd5e",
};

describe("CharacterList", () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── Rendering ────────────────────────────────────────────

  it("renders the page heading", () => {
    render(<CharacterList {...defaultProps} />);
    expect(screen.getByText("Characters")).toBeInTheDocument();
  });

  it("renders character count", () => {
    render(<CharacterList {...defaultProps} />);
    expect(screen.getByText(/1 character/i)).toBeInTheDocument();
  });

  it("renders character cards with name", () => {
    render(<CharacterList {...defaultProps} />);
    expect(screen.getByText("Durk Stonefeld")).toBeInTheDocument();
  });

  it("renders character level", () => {
    render(<CharacterList {...defaultProps} />);
    expect(screen.getByText(/level 1/i)).toBeInTheDocument();
  });

  it("shows empty state when no characters", () => {
    render(<CharacterList {...defaultProps} characters={[]} />);
    expect(screen.getByText(/no characters yet/i)).toBeInTheDocument();
  });

  // ─── Navigation ───────────────────────────────────────────

  it("has a back button to campaign page", () => {
    render(<CharacterList {...defaultProps} />);
    expect(screen.getByText(/test campaign/i)).toBeInTheDocument();
  });

  it("navigates to character detail on card click", async () => {
    const user = userEvent.setup();
    render(<CharacterList {...defaultProps} />);
    await user.click(screen.getByText("Durk Stonefeld"));
    expect(mockPush).toHaveBeenCalledWith(
      "/campaign/campaign-1/characters/char-1"
    );
  });

  // ─── Create ───────────────────────────────────────────────

  it("shows create button for GMs", () => {
    render(<CharacterList {...defaultProps} />);
    expect(screen.getByText(/new character/i)).toBeInTheDocument();
  });

  it("shows create button for players", () => {
    render(<CharacterList {...defaultProps} role="player" />);
    expect(screen.getByText(/new character/i)).toBeInTheDocument();
  });

  it("opens create dialog when button is clicked", async () => {
    const user = userEvent.setup();
    render(<CharacterList {...defaultProps} />);
    await user.click(screen.getByText(/new character/i));
    expect(screen.getByLabelText("Character Name")).toBeInTheDocument();
  });
});
