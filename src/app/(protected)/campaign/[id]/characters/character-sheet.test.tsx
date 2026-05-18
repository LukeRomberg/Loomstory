import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CharacterSheet } from "./character-sheet";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}));

const mockUpdate = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null }),
});

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      update: mockUpdate,
      upsert: vi.fn().mockResolvedValue({ error: null }),
      eq: vi.fn().mockReturnThis(),
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
    },
  }),
}));

const mockCharacter = {
  id: "char-1",
  campaign_id: "campaign-1",
  name: "Durk Stonefeld",
  level: 1,
  experience: 7,
  hp_current: 25,
  hp_max: 25,
  system_id: "system-dw",
  user_id: "user-1",
  portrait_url: null,
  gm_notes: null,
  data: { race: "Half-Orc", playbook: "Fighter", armor: 3, damage_die: "d10" },
};

const mockTemplate = [
  {
    key: "identity",
    label: "Identity",
    order: 1,
    layout: "grid" as const,
    columns: 2,
    fields: [
      {
        key: "race",
        label: "Race",
        type: "text" as const,
        order: 1,
        storage: { target: "data" as const, path: "race" },
      },
    ],
  },
  {
    key: "ability_scores",
    label: "Ability Scores",
    order: 2,
    layout: "grid" as const,
    columns: 6,
    fields: [
      {
        key: "str",
        label: "Strength",
        type: "stat_block" as const,
        order: 1,
        storage: { target: "stat" as const, stat_key: "str", data_fields: ["modifier"] },
        min: 3,
        max: 18,
      },
    ],
  },
  {
    key: "combat",
    label: "Combat",
    order: 3,
    layout: "grid" as const,
    fields: [
      {
        key: "hp_current",
        label: "HP",
        type: "number" as const,
        order: 1,
        storage: { target: "core" as const, column: "hp_current" as const },
      },
      {
        key: "armor",
        label: "Armor",
        type: "number" as const,
        order: 2,
        storage: { target: "data" as const, path: "armor" },
      },
    ],
  },
];

const mockStats = [
  { id: "stat-1", stat_key: "str", value: 16, data: { modifier: 2 } },
];

const defaultProps = {
  character: mockCharacter,
  campaignId: "campaign-1",
  role: "gm",
  userId: "user-1",
  template: mockTemplate,
  stats: mockStats,
  abilities: [],
  resources: [],
  items: [],
  notes: [],
  conditions: [],
};

describe("CharacterSheet", () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── Rendering ────────────────────────────────────────────

  it("renders the character name", () => {
    render(<CharacterSheet {...defaultProps} />);
    expect(screen.getByText("Durk Stonefeld")).toBeInTheDocument();
  });

  it("renders the character level", () => {
    render(<CharacterSheet {...defaultProps} />);
    expect(screen.getByText(/level 1/i)).toBeInTheDocument();
  });

  it("renders template section headers", () => {
    render(<CharacterSheet {...defaultProps} />);
    expect(screen.getByText("Identity")).toBeInTheDocument();
    expect(screen.getByText("Ability Scores")).toBeInTheDocument();
    expect(screen.getByText("Combat")).toBeInTheDocument();
  });

  it("renders stat values from character_stats", () => {
    render(<CharacterSheet {...defaultProps} />);
    expect(screen.getByText("Strength")).toBeInTheDocument();
    expect(screen.getByDisplayValue("16")).toBeInTheDocument();
  });

  it("renders data fields from characters.data", () => {
    render(<CharacterSheet {...defaultProps} />);
    expect(screen.getByDisplayValue("Half-Orc")).toBeInTheDocument();
  });

  it("renders core fields from character row", () => {
    render(<CharacterSheet {...defaultProps} />);
    expect(screen.getByDisplayValue("25")).toBeInTheDocument();
  });

  // ─── GM Notes ─────────────────────────────────────────────

  it("shows GM notes section for GMs", () => {
    render(<CharacterSheet {...defaultProps} />);
    expect(screen.getByText(/gm notes/i)).toBeInTheDocument();
  });

  it("hides GM notes section for players", () => {
    render(<CharacterSheet {...defaultProps} role="player" />);
    expect(screen.queryByText(/gm notes/i)).not.toBeInTheDocument();
  });
});
