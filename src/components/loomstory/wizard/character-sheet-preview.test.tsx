import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CharacterSheetPreview } from "./character-sheet-preview";
import { DAGGERHEART_CLASS_THEMES } from "@/lib/character/configs/daggerheart-wizard";
import type {
  WizardState,
  CompendiumClass,
  CompendiumAbility,
  CompendiumItem,
} from "@/lib/character/wizard-types";

// ─── Mock data ──────────────────────────────────────────────────
// A complete happy-path Ranger character ready for review.

const mockState: WizardState = {
  name: "Kael",
  classId: "cls-ranger",
  className: "Ranger",
  subclassId: "sub-beastbound",
  subclassName: "Beastbound",
  ancestryName: "Faerie",
  ancestryVariant: "female",
  communityName: "Wanderborne",
  statValues: { agility: 2, strength: 1, finesse: 1, instinct: 0, presence: 0, knowledge: -1 },
  experiences: [{ name: "Bounty Hunter" }, { name: "Wolf in Sheep's Clothing" }],
  primaryWeaponId: "item-longsword",
  primaryWeaponIsTwoHanded: false,
  secondaryWeaponId: "item-shortsword",
  armorId: "armor-leather",
  potionId: "consumable-minor-health",
  classItemName: "Trophy from your first kill",
  selections: {},
  classConfig: {},
};

const mockRangerClass: CompendiumClass = {
  id: "cls-ranger",
  name: "Ranger",
  is_subclass: false,
  parent_class_id: null,
  hp_die: null,
  data: { domains: ["Bone", "Sage"], evasion: 12, hp_slots: 6, spellcast_trait: "Agility" },
  source: "Daggerheart SRD",
};

const mockBeastboundSubclass: CompendiumClass = {
  id: "sub-beastbound",
  name: "Beastbound",
  is_subclass: true,
  parent_class_id: "cls-ranger",
  hp_die: null,
  data: { description: "Form a deep bond with an animal ally." },
  source: "Daggerheart SRD",
};

const mockAncestryFeatures: CompendiumAbility[] = [
  {
    id: "feat-faerie-luckbender",
    name: "Faerie: Luckbender",
    ability_type: "ancestry_feature",
    description: "Once per session, reroll the Duality Dice.",
    level: null,
    classes: null,
    source: "Daggerheart SRD",
    data: { ancestry: "Faerie", position: "top" },
  },
  {
    id: "feat-faerie-wings",
    name: "Faerie: Wings",
    ability_type: "ancestry_feature",
    description: "You can fly.",
    level: null,
    classes: null,
    source: "Daggerheart SRD",
    data: { ancestry: "Faerie", position: "bottom" },
  },
];

const mockCommunityFeatures: CompendiumAbility[] = [
  {
    id: "feat-wanderborne",
    name: "Wanderborne: Nomadic Pack",
    ability_type: "community_feature",
    description: "Add a Nomadic Pack to your inventory.",
    level: null,
    classes: null,
    source: "Daggerheart SRD",
    data: { community: "Wanderborne" },
  },
];

const mockClassFeatures: CompendiumAbility[] = [
  {
    id: "feat-ranger-hope",
    name: "Ranger: Hold Them Off",
    ability_type: "class_feature",
    description: "Spend 3 Hope to use that same attack against two additional adversaries.",
    level: null,
    classes: ["Ranger"],
    source: "Daggerheart SRD",
    data: { feature_category: "hope_feature" },
  },
  {
    id: "feat-ranger-class",
    name: "Ranger: Ranger's Focus",
    ability_type: "class_feature",
    description: "Spend a Hope and make an attack against a target.",
    level: null,
    classes: ["Ranger"],
    source: "Daggerheart SRD",
    data: { feature_category: "class_feature" },
  },
];

const mockSubclassFeatures: CompendiumAbility[] = [
  {
    id: "feat-beastbound-companion",
    name: "Beastbound: Companion",
    ability_type: "subclass_feature",
    description: "You have an animal companion.",
    level: null,
    classes: ["Ranger"],
    source: "Daggerheart SRD",
    data: { subclass: "Beastbound", feature_category: "foundation_feature" },
  },
];

const mockDomainCards: CompendiumAbility[] = [
  {
    id: "card-bone-1",
    name: "Knife Tossing",
    ability_type: "domain_card",
    description: "Throw a knife at a target within Close range.",
    level: 1,
    classes: ["Ranger"],
    source: "Daggerheart SRD",
    data: { domain: "Bone", card_type: "ability" },
  },
  {
    id: "card-sage-1",
    name: "Vicious Entangle",
    ability_type: "domain_card",
    description: "Vines erupt from the ground.",
    level: 1,
    classes: ["Ranger"],
    source: "Daggerheart SRD",
    data: { domain: "Sage", card_type: "spell" },
  },
];

const mockPrimaryWeapon: CompendiumItem = {
  id: "item-longsword",
  name: "Longsword",
  type: "weapon",
  description: "Tier 1 one-handed.",
  properties: {
    tier: 1,
    category: "Primary",
    type: "One-Handed",
    primary_trait: "Agility",
    damage: "d8 phy",
    range: "Melee",
  },
  source: "Daggerheart SRD",
};

const mockSecondaryWeapon: CompendiumItem = {
  id: "item-shortsword",
  name: "Shortsword",
  type: "weapon",
  description: "Tier 1 secondary.",
  properties: {
    tier: 1,
    category: "Secondary",
    type: "One-Handed",
    primary_trait: "Agility",
    damage: "d8 phy",
    range: "Melee",
  },
  source: "Daggerheart SRD",
};

const mockArmor: CompendiumItem = {
  id: "armor-leather",
  name: "Leather Armor",
  type: "armor",
  description: "Tier 1.",
  properties: { tier: 1, base_score: 3, thresholds: "6/13" },
  source: "Daggerheart SRD",
};

const mockPotion: CompendiumItem = {
  id: "consumable-minor-health",
  name: "Minor Health Potion",
  type: "consumable",
  description: "Clear 1d4 HP.",
  properties: {},
  source: "Daggerheart SRD",
};

function defaultProps() {
  return {
    wizardState: mockState,
    selectedClass: mockRangerClass,
    selectedSubclass: mockBeastboundSubclass,
    ancestryFeatures: mockAncestryFeatures,
    communityFeatures: mockCommunityFeatures,
    classFeatures: mockClassFeatures,
    subclassFeatures: mockSubclassFeatures,
    domainCards: mockDomainCards,
    primaryWeapon: mockPrimaryWeapon as CompendiumItem | null,
    secondaryWeapon: mockSecondaryWeapon as CompendiumItem | null,
    armor: mockArmor as CompendiumItem | null,
    potion: mockPotion as CompendiumItem | null,
    classTheme: DAGGERHEART_CLASS_THEMES.Ranger,
    onNameChange: vi.fn(),
    onCreate: vi.fn(),
  };
}

// ─── Banner ─────────────────────────────────────────────────────

describe("CharacterSheetPreview — Banner", () => {
  it("renders the class icon inside the banner", () => {
    render(<CharacterSheetPreview {...defaultProps()} />);
    const banner = screen.getByTestId("preview-banner");
    expect(within(banner).getByTestId("preview-class-icon")).toBeInTheDocument();
  });

  it("renders the ancestry icon inside the banner", () => {
    render(<CharacterSheetPreview {...defaultProps()} />);
    const banner = screen.getByTestId("preview-banner");
    expect(within(banner).getByTestId("preview-ancestry-icon")).toBeInTheDocument();
  });

  it("renders a headshot <img> for ancestries that have artwork (e.g. Clank)", () => {
    // Clank is the lone ungendered SRD ancestry — the banner uses the
    // `neutral` variant regardless of ancestryVariant state.
    render(
      <CharacterSheetPreview
        {...defaultProps()}
        wizardState={{ ...mockState, ancestryName: "Clank" }}
      />
    );
    const banner = screen.getByTestId("preview-banner");
    const icon = within(banner).getByTestId("preview-ancestry-icon");
    // The img/next-image renders an underlying <img> tag with the PNG path.
    expect(icon.tagName.toLowerCase()).toBe("img");
    expect(icon.getAttribute("src") ?? "").toMatch(/Clank\.png/);
  });

  it("respects ancestryVariant when selecting between female and male portraits", () => {
    // Drakona has both -f and -m portraits — the banner switches based on
    // wizardState.ancestryVariant.
    const { rerender } = render(
      <CharacterSheetPreview
        {...defaultProps()}
        wizardState={{ ...mockState, ancestryName: "Drakona", ancestryVariant: "female" }}
      />
    );
    let icon = within(screen.getByTestId("preview-banner")).getByTestId("preview-ancestry-icon");
    expect(icon.getAttribute("src") ?? "").toMatch(/Drakona-f\.png/);

    rerender(
      <CharacterSheetPreview
        {...defaultProps()}
        wizardState={{ ...mockState, ancestryName: "Drakona", ancestryVariant: "male" }}
      />
    );
    icon = within(screen.getByTestId("preview-banner")).getByTestId("preview-ancestry-icon");
    expect(icon.getAttribute("src") ?? "").toMatch(/Drakona-m\.png/);
  });

  it("falls back to the Lucide icon for ancestries with no artwork in the images map", () => {
    // All 18 SRD ancestries currently have PNGs; this test uses a hypothetical
    // ancestry name not in DAGGERHEART_ANCESTRY_IMAGES to exercise the fallback
    // path. The Lucide map is referenced even if there's no specific icon —
    // the empty <span> slot is the lowest-priority fallback.
    render(
      <CharacterSheetPreview
        {...defaultProps()}
        wizardState={{ ...mockState, ancestryName: "Nonexistent" }}
      />
    );
    const banner = screen.getByTestId("preview-banner");
    const icon = within(banner).getByTestId("preview-ancestry-icon");
    expect(icon.tagName.toLowerCase()).not.toBe("img");
  });

  it("renders the name input pre-filled from wizard state", () => {
    render(<CharacterSheetPreview {...defaultProps()} />);
    const input = screen.getByPlaceholderText(/name your hero/i);
    expect(input).toHaveValue("Kael");
  });

  it("calls onNameChange when the user types in the name input", async () => {
    const onNameChange = vi.fn();
    const user = userEvent.setup();
    render(
      <CharacterSheetPreview
        {...defaultProps()}
        wizardState={{ ...mockState, name: "" }}
        onNameChange={onNameChange}
      />
    );
    const input = screen.getByPlaceholderText(/name your hero/i);
    await user.type(input, "K");
    expect(onNameChange).toHaveBeenCalledWith("K");
  });

  it("renders the class name and domain labels", () => {
    render(<CharacterSheetPreview {...defaultProps()} />);
    const banner = screen.getByTestId("preview-banner");
    // "Ranger" appears in tagline + class label — both inside banner is fine.
    expect(within(banner).getAllByText(/Ranger/).length).toBeGreaterThan(0);
    expect(within(banner).getByText(/Bone/)).toBeInTheDocument();
    expect(within(banner).getByText(/Sage/)).toBeInTheDocument();
  });
});

// ─── Left column ────────────────────────────────────────────────

describe("CharacterSheetPreview — Sheet body, left column", () => {
  it("shows the class's starting Evasion value", () => {
    render(<CharacterSheetPreview {...defaultProps()} />);
    const combat = screen.getByTestId("preview-combat");
    expect(within(combat).getByText("12")).toBeInTheDocument();
  });

  it("shows the chosen armor's base score in combat block", () => {
    render(<CharacterSheetPreview {...defaultProps()} />);
    const combat = screen.getByTestId("preview-combat");
    expect(within(combat).getByText("3")).toBeInTheDocument();
  });

  it("renders the right number of HP slot pips for the class", () => {
    render(<CharacterSheetPreview {...defaultProps()} />);
    const combat = screen.getByTestId("preview-combat");
    const hpPips = within(combat).getAllByTestId(/^hp-pip/);
    expect(hpPips).toHaveLength(6);
  });

  it("renders 6 stress pips by default", () => {
    render(<CharacterSheetPreview {...defaultProps()} />);
    const combat = screen.getByTestId("preview-combat");
    const stressPips = within(combat).getAllByTestId(/^stress-pip/);
    expect(stressPips).toHaveLength(6);
  });

  it("renders Hope as 6 diamond tokens with 2 filled (starting Hope)", () => {
    render(<CharacterSheetPreview {...defaultProps()} />);
    const hope = screen.getByTestId("preview-hope");
    expect(within(hope).getAllByTestId("hope-token-filled")).toHaveLength(2);
    expect(within(hope).getAllByTestId("hope-token-empty")).toHaveLength(4);
  });

  it("renders the class's Hope feature with description", () => {
    render(<CharacterSheetPreview {...defaultProps()} />);
    expect(screen.getByText("Hold Them Off")).toBeInTheDocument();
    expect(screen.getByText(/Spend 3 Hope/)).toBeInTheDocument();
  });

  it("renders the class's Class Feature with description", () => {
    render(<CharacterSheetPreview {...defaultProps()} />);
    expect(screen.getByText("Ranger's Focus")).toBeInTheDocument();
    expect(screen.getByText(/Spend a Hope and make/)).toBeInTheDocument();
  });

  it("renders the subclass Foundation Feature (with subclass prefix stripped)", () => {
    render(<CharacterSheetPreview {...defaultProps()} />);
    const subclassSection = screen.getByTestId("preview-subclass-feature");
    // "Beastbound: Companion" → "Companion"
    expect(within(subclassSection).getByText("Companion")).toBeInTheDocument();
    expect(within(subclassSection).getByText(/You have an animal companion/)).toBeInTheDocument();
  });

  it("hides the subclass feature section when no foundation feature is provided", () => {
    render(<CharacterSheetPreview {...defaultProps()} subclassFeatures={[]} />);
    expect(screen.queryByTestId("preview-subclass-feature")).not.toBeInTheDocument();
  });

  it("lists each non-empty experience with +2", () => {
    render(<CharacterSheetPreview {...defaultProps()} />);
    const expSection = screen.getByTestId("preview-experiences");
    expect(within(expSection).getByText("Bounty Hunter")).toBeInTheDocument();
    expect(within(expSection).getByText("Wolf in Sheep's Clothing")).toBeInTheDocument();
    expect(within(expSection).getAllByText("+2")).toHaveLength(2);
  });

  it("omits experiences with empty names", () => {
    render(
      <CharacterSheetPreview
        {...defaultProps()}
        wizardState={{
          ...mockState,
          experiences: [{ name: "Bounty Hunter" }, { name: "" }],
        }}
      />
    );
    const expSection = screen.getByTestId("preview-experiences");
    expect(within(expSection).getAllByText("+2")).toHaveLength(1);
  });
});

// ─── Right column ───────────────────────────────────────────────

describe("CharacterSheetPreview — Sheet body, right column", () => {
  it("renders all 6 trait labels", () => {
    render(<CharacterSheetPreview {...defaultProps()} />);
    const traits = screen.getByTestId("preview-traits");
    expect(within(traits).getByText("Agility")).toBeInTheDocument();
    expect(within(traits).getByText("Strength")).toBeInTheDocument();
    expect(within(traits).getByText("Finesse")).toBeInTheDocument();
    expect(within(traits).getByText("Instinct")).toBeInTheDocument();
    expect(within(traits).getByText("Presence")).toBeInTheDocument();
    expect(within(traits).getByText("Knowledge")).toBeInTheDocument();
  });

  it("renders the assigned trait modifier values (+2, +1, +1, +0, +0, -1)", () => {
    render(<CharacterSheetPreview {...defaultProps()} />);
    const traits = screen.getByTestId("preview-traits");
    expect(within(traits).getByText("+2")).toBeInTheDocument();
    expect(within(traits).getAllByText("+1")).toHaveLength(2);
    expect(within(traits).getAllByText("+0")).toHaveLength(2);
    expect(within(traits).getByText("-1")).toBeInTheDocument();
  });

  it("displays Proficiency 1 at level 1", () => {
    render(<CharacterSheetPreview {...defaultProps()} />);
    const weapons = screen.getByTestId("preview-weapons");
    expect(within(weapons).getByText(/Proficiency/i)).toBeInTheDocument();
    expect(within(weapons).getByTestId("proficiency-value")).toHaveTextContent("1");
  });

  it("renders the primary weapon with name and stats", () => {
    render(<CharacterSheetPreview {...defaultProps()} />);
    const weapons = screen.getByTestId("preview-weapons");
    expect(within(weapons).getByText("Longsword")).toBeInTheDocument();
    // Both primary + secondary in this mock have d8 phy / Melee — assert presence.
    expect(within(weapons).getAllByText(/d8 phy/).length).toBeGreaterThan(0);
    expect(within(weapons).getAllByText(/Melee/).length).toBeGreaterThan(0);
  });

  it("renders the secondary weapon when present", () => {
    render(<CharacterSheetPreview {...defaultProps()} />);
    const weapons = screen.getByTestId("preview-weapons");
    expect(within(weapons).getByText("Shortsword")).toBeInTheDocument();
  });

  it("hides the secondary weapon row when not provided (2H primary path)", () => {
    render(<CharacterSheetPreview {...defaultProps()} secondaryWeapon={null} />);
    expect(screen.queryByText("Shortsword")).not.toBeInTheDocument();
  });

  it("renders the armor name, thresholds, and base score", () => {
    render(<CharacterSheetPreview {...defaultProps()} />);
    const armor = screen.getByTestId("preview-armor");
    expect(within(armor).getByText("Leather Armor")).toBeInTheDocument();
    expect(within(armor).getByText(/6\/13/)).toBeInTheDocument();
    expect(within(armor).getByText(/Score 3/)).toBeInTheDocument();
  });

  it("renders inventory with basic supplies, potion, and class item", () => {
    render(<CharacterSheetPreview {...defaultProps()} />);
    const inventory = screen.getByTestId("preview-inventory");
    expect(within(inventory).getByText(/Torch/i)).toBeInTheDocument();
    expect(within(inventory).getByText(/Rope/i)).toBeInTheDocument();
    expect(within(inventory).getByText(/Basic Supplies/i)).toBeInTheDocument();
    expect(within(inventory).getByText(/Handful of Gold/i)).toBeInTheDocument();
    expect(within(inventory).getByText(/Minor Health Potion/)).toBeInTheDocument();
    expect(within(inventory).getByText(/Trophy from your first kill/)).toBeInTheDocument();
  });
});

// ─── Heritage features ──────────────────────────────────────────

describe("CharacterSheetPreview — Heritage features", () => {
  it("renders both ancestry feature names", () => {
    render(<CharacterSheetPreview {...defaultProps()} />);
    const heritage = screen.getByTestId("preview-heritage-features");
    expect(within(heritage).getByText("Wings")).toBeInTheDocument();
    expect(within(heritage).getByText("Luckbender")).toBeInTheDocument();
  });

  it("renders the community feature name", () => {
    render(<CharacterSheetPreview {...defaultProps()} />);
    const heritage = screen.getByTestId("preview-heritage-features");
    expect(within(heritage).getByText("Nomadic Pack")).toBeInTheDocument();
  });

  it("renders the descriptions of every heritage feature", () => {
    render(<CharacterSheetPreview {...defaultProps()} />);
    const heritage = screen.getByTestId("preview-heritage-features");
    expect(within(heritage).getByText(/You can fly/)).toBeInTheDocument();
    expect(within(heritage).getByText(/Once per session/)).toBeInTheDocument();
    expect(within(heritage).getByText(/Add a Nomadic Pack/)).toBeInTheDocument();
  });

  it("hides the heritage section when no heritage features are provided", () => {
    render(
      <CharacterSheetPreview
        {...defaultProps()}
        ancestryFeatures={[]}
        communityFeatures={[]}
      />
    );
    expect(screen.queryByTestId("preview-heritage-features")).not.toBeInTheDocument();
  });
});

// ─── Domain cards ───────────────────────────────────────────────

describe("CharacterSheetPreview — Domain cards", () => {
  it("renders both chosen domain cards with names + descriptions", () => {
    render(<CharacterSheetPreview {...defaultProps()} />);
    const cards = screen.getByTestId("preview-domain-cards");
    expect(within(cards).getByText("Knife Tossing")).toBeInTheDocument();
    expect(within(cards).getByText("Vicious Entangle")).toBeInTheDocument();
    expect(within(cards).getByText(/Throw a knife/)).toBeInTheDocument();
    expect(within(cards).getByText(/Vines erupt/)).toBeInTheDocument();
  });

  it("renders the domain label on each card (Bone, Sage)", () => {
    render(<CharacterSheetPreview {...defaultProps()} />);
    const cards = screen.getByTestId("preview-domain-cards");
    expect(within(cards).getByText("Bone")).toBeInTheDocument();
    expect(within(cards).getByText("Sage")).toBeInTheDocument();
  });

  it("hides the domain cards section when no cards are provided", () => {
    render(<CharacterSheetPreview {...defaultProps()} domainCards={[]} />);
    expect(screen.queryByTestId("preview-domain-cards")).not.toBeInTheDocument();
  });
});

// ─── Theming ────────────────────────────────────────────────────

describe("CharacterSheetPreview — Theming", () => {
  it("renders the banner with a transparent leather-bordered frame", () => {
    // Themed gradients were removed in favor of a clean parchment look —
    // the banner now uses a single leather border with no gradient fill.
    render(<CharacterSheetPreview {...defaultProps()} />);
    const banner = screen.getByTestId("preview-banner");
    expect(banner.className).toContain("border-leather");
    expect(banner.className).not.toContain("from-emerald");
    expect(banner.className).not.toContain("from-zinc");
  });
});

// ─── Create button ──────────────────────────────────────────────

describe("CharacterSheetPreview — Create button", () => {
  it("renders 'Start Your Adventure!' button", () => {
    render(<CharacterSheetPreview {...defaultProps()} />);
    expect(
      screen.getByRole("button", { name: /start your adventure/i })
    ).toBeInTheDocument();
  });

  it("is disabled when name is empty", () => {
    render(
      <CharacterSheetPreview
        {...defaultProps()}
        wizardState={{ ...mockState, name: "" }}
      />
    );
    expect(
      screen.getByRole("button", { name: /start your adventure/i })
    ).toBeDisabled();
  });

  it("is disabled when name is whitespace only", () => {
    render(
      <CharacterSheetPreview
        {...defaultProps()}
        wizardState={{ ...mockState, name: "   " }}
      />
    );
    expect(
      screen.getByRole("button", { name: /start your adventure/i })
    ).toBeDisabled();
  });

  it("is enabled when name has trimmed content", () => {
    render(<CharacterSheetPreview {...defaultProps()} />);
    expect(
      screen.getByRole("button", { name: /start your adventure/i })
    ).not.toBeDisabled();
  });

  it("calls onCreate when clicked", async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();
    render(<CharacterSheetPreview {...defaultProps()} onCreate={onCreate} />);
    await user.click(screen.getByRole("button", { name: /start your adventure/i }));
    expect(onCreate).toHaveBeenCalled();
  });

  it("shows a loading label and stays disabled when `creating` is true", () => {
    render(<CharacterSheetPreview {...defaultProps()} creating />);
    const button = screen.getByRole("button", { name: /creating/i });
    expect(button).toBeDisabled();
  });
});

// ─── Conditional rendering ──────────────────────────────────────

describe("CharacterSheetPreview — Conditional rendering", () => {
  it("hides Active Weapons section when no weapon is provided", () => {
    render(
      <CharacterSheetPreview
        {...defaultProps()}
        primaryWeapon={null}
        secondaryWeapon={null}
      />
    );
    expect(screen.queryByTestId("preview-weapons")).not.toBeInTheDocument();
  });

  it("hides Active Armor section when no armor is provided", () => {
    render(<CharacterSheetPreview {...defaultProps()} armor={null} />);
    expect(screen.queryByTestId("preview-armor")).not.toBeInTheDocument();
  });

  it("hides Experiences section when both experience names are empty", () => {
    render(
      <CharacterSheetPreview
        {...defaultProps()}
        wizardState={{
          ...mockState,
          experiences: [{ name: "" }, { name: "" }],
        }}
      />
    );
    expect(screen.queryByTestId("preview-experiences")).not.toBeInTheDocument();
  });
});
