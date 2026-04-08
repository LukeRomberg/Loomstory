import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CharacterList } from "./character-list";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
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
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  }),
}));

// Mock the wizard — we just test that it opens/closes, not its internals
vi.mock("@/components/loomstory/wizard/character-wizard", () => ({
  CharacterWizard: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? (
      <div data-testid="character-wizard">
        <button onClick={onClose}>Close Wizard</button>
      </div>
    ) : null,
}));

vi.mock("@/lib/character/wizard-registry", () => ({
  getWizardConfig: (slug: string) =>
    slug === "daggerheart"
      ? { phases: [], steps: {} }
      : null,
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
  systemId: "system-dh",
  systemSlug: "daggerheart",
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

  // ─── Create (Wizard) ─────────────────────────────────────

  it("shows create button", () => {
    render(<CharacterList {...defaultProps} />);
    expect(screen.getByText(/new character/i)).toBeInTheDocument();
  });

  it("opens wizard when New Character button is clicked", async () => {
    const user = userEvent.setup();
    render(<CharacterList {...defaultProps} />);

    expect(screen.queryByTestId("character-wizard")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /new character/i }));
    expect(screen.getByTestId("character-wizard")).toBeInTheDocument();
  });

  it("closes wizard when close is triggered", async () => {
    const user = userEvent.setup();
    render(<CharacterList {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /new character/i }));
    expect(screen.getByTestId("character-wizard")).toBeInTheDocument();

    await user.click(screen.getByText("Close Wizard"));
    expect(screen.queryByTestId("character-wizard")).not.toBeInTheDocument();
  });

  it("does not render wizard when systemSlug has no config", () => {
    render(<CharacterList {...defaultProps} systemSlug="unknown-system" />);
    // Wizard should not be in the DOM at all
    expect(screen.queryByTestId("character-wizard")).not.toBeInTheDocument();
  });
});
