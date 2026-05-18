import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/loomstory/wizard/character-wizard", () => ({
  CharacterWizard: () => null,
}));

vi.mock("@/lib/character/wizard-registry", () => ({
  getWizardConfig: () => ({ steps: [] }),
}));

vi.mock("./character-sheet-loader", () => ({
  CharacterSheetLoader: () => null,
}));

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockRefresh = vi.fn();
let searchParams = new URLSearchParams();
vi.mock("@/hooks/use-transition-router", () => ({
  useTransitionRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
  }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
  }),
  useSearchParams: () => searchParams,
}));

import { CharacterList } from "./character-list";

const mockCharacter = {
  id: "char-1",
  name: "Lyra Brightblade",
  level: 3,
  hp_current: 18,
  hp_max: 25,
  system_id: "system-1",
  user_id: "user-1",
  portrait_url: null,
  data: { class: "Wizard", ancestry: "Human" },
};

const defaultProps = {
  campaignId: "campaign-1",
  campaignName: "Test Campaign",
  characters: [mockCharacter],
  role: "gm",
  userId: "user-1",
  systemId: "system-1",
  systemSlug: "daggerheart",
};

describe("CharacterList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParams = new URLSearchParams();
  });

  it("renders the page heading", () => {
    render(<CharacterList {...defaultProps} />);
    expect(screen.getByText(/characters/i)).toBeInTheDocument();
  });

  it("renders the count in the heading", () => {
    render(<CharacterList {...defaultProps} />);
    expect(screen.getByText("(1)")).toBeInTheDocument();
  });

  it("renders the character name in the master list", () => {
    render(<CharacterList {...defaultProps} />);
    expect(screen.getByText("Lyra Brightblade")).toBeInTheDocument();
  });

  it("renders level badge in the master list", () => {
    render(<CharacterList {...defaultProps} />);
    expect(screen.getByText(/lv 3/i)).toBeInTheDocument();
  });

  it("shows empty state when no characters", () => {
    render(<CharacterList {...defaultProps} characters={[]} />);
    expect(screen.getByText(/no characters yet/i)).toBeInTheDocument();
  });

  it("renders the new-character overlay", () => {
    render(<CharacterList {...defaultProps} />);
    expect(screen.getByLabelText(/new character/i)).toBeInTheDocument();
  });

  it("renders a back link to the bookshelf", () => {
    render(<CharacterList {...defaultProps} />);
    expect(screen.getByLabelText(/back to bookshelf/i)).toBeInTheDocument();
  });
});
