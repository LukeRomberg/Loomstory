import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CharacterWizard } from "./character-wizard";
import { DAGGERHEART_WIZARD_CONFIG } from "@/lib/character/configs/daggerheart-wizard";

// Suppress the HelpPopup in this suite — the popup has its own dedicated tests in
// character-wizard-help.test.tsx. Mocking it here keeps the step-navigation tests
// focused on wizard mechanics rather than walking through the popup on every step.
vi.mock("./help-popup", () => ({
  HelpPopup: () => null,
}));

// ─── Mocks ──────────────────────────────────────────────────

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn(), back: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

const mockClasses = [
  {
    id: "cls-warrior",
    name: "Warrior",
    is_subclass: false,
    parent_class_id: null,
    system_id: "sys-dh",
    hp_die: null,
    data: { domains: ["Blade", "Bone"], evasion: 11, hp_slots: 6, foundation_features: ["No Mercy"] },
    source: "Daggerheart SRD",
  },
  {
    id: "cls-druid",
    name: "Druid",
    is_subclass: false,
    parent_class_id: null,
    system_id: "sys-dh",
    hp_die: null,
    // Druid is a spellcaster (spellcast_trait set), so the magic-weapon filter
    // lets them see both physical and magic weapons in the picker.
    data: {
      domains: ["Sage", "Arcana"],
      evasion: 10,
      hp_slots: 6,
      spellcast_trait: "Instinct",
      foundation_features: ["Beastform"],
    },
    source: "Daggerheart SRD",
  },
];

const mockSubclasses = [
  {
    id: "sub-brave",
    name: "Call of the Brave",
    is_subclass: true,
    parent_class_id: "cls-warrior",
    system_id: "sys-dh",
    hp_die: null,
    data: {},
    source: "Daggerheart SRD",
  },
  {
    id: "sub-slayer",
    name: "Call of the Slayer",
    is_subclass: true,
    parent_class_id: "cls-warrior",
    system_id: "sys-dh",
    hp_die: null,
    data: {},
    source: "Daggerheart SRD",
  },
  // Druid subclasses — used by the class-change stale-state regression test below.
  {
    id: "sub-elements",
    name: "Warden of the Elements",
    is_subclass: true,
    parent_class_id: "cls-druid",
    system_id: "sys-dh",
    hp_die: null,
    data: {},
    source: "Daggerheart SRD",
  },
];

const mockClassFeatures = [
  {
    id: "feat-warrior-hope",
    name: "Warrior: No Mercy",
    ability_type: "class_feature",
    description:
      "Spend 3 Hope to gain a +1 bonus to your attack rolls until your next rest.",
    classes: ["Warrior"],
    data: { feature_category: "hope_feature" },
  },
  {
    id: "feat-warrior-class",
    name: "Warrior: Attack of Opportunity",
    ability_type: "class_feature",
    description:
      "When an adversary within Melee range tries to leave that range, you can mark a Stress to make a reaction attack.",
    classes: ["Warrior"],
    data: { feature_category: "class_feature" },
  },
  {
    id: "feat-druid-hope",
    name: "Druid: Druid's Hope",
    ability_type: "class_feature",
    description: "Druid hope description.",
    classes: ["Druid"],
    data: { feature_category: "hope_feature" },
  },
];

const mockAncestryFeatures = [
  // Faerie — 2 features (flavor on both rows mirrors the production migration)
  {
    id: "feat-faerie-luckbender",
    name: "Faerie: Luckbender",
    ability_type: "ancestry_feature",
    description:
      "Once per session, after you or a willing ally within Close range makes an action roll, you can spend 3 Hope to reroll the Duality Dice.",
    classes: null,
    data: {
      ancestry: "Faerie",
      position: "top",
      flavor: "Faeries are winged humanoid creatures with insectile features.",
    },
  },
  {
    id: "feat-faerie-wings",
    name: "Faerie: Wings",
    ability_type: "ancestry_feature",
    description:
      "You can fly. While flying, you can mark a Stress after an adversary makes an attack against you to gain a +2 bonus to your Evasion against that attack.",
    classes: null,
    data: {
      ancestry: "Faerie",
      position: "bottom",
      flavor: "Faeries are winged humanoid creatures with insectile features.",
    },
  },
  // Katari — 2 features
  {
    id: "feat-katari-instincts",
    name: "Katari: Feline Instincts",
    ability_type: "ancestry_feature",
    description: "When you make an Agility Roll, you can spend 2 Hope to reroll your Hope Die.",
    classes: null,
    data: {
      ancestry: "Katari",
      position: "top",
      flavor: "Katari are feline humanoids with retractable claws.",
    },
  },
  {
    id: "feat-katari-claws",
    name: "Katari: Retracting Claws",
    ability_type: "ancestry_feature",
    description:
      "Make an Agility Roll to scratch a target within Melee range. On a success, they become temporarily Vulnerable.",
    classes: null,
    data: { ancestry: "Katari", position: "bottom" },
  },
];

const mockCommunityFeatures = [
  {
    id: "feat-highborne",
    name: "Highborne: Privilege",
    ability_type: "community_feature",
    description:
      "You have advantage on rolls to consort with nobles, negotiate prices, or leverage your reputation to get what you want.",
    classes: null,
    data: {
      community: "Highborne",
      flavor:
        "Being part of a highborne community means you're accustomed to a life of elegance, opulence, and prestige.",
      adjectives: ["amiable", "candid", "conniving", "enterprising", "ostentatious", "unflappable"],
    },
  },
  {
    id: "feat-wanderborne",
    name: "Wanderborne: Nomadic Pack",
    ability_type: "community_feature",
    description:
      "Add a Nomadic Pack to your inventory. Once per session, you can spend a Hope to reach into this pack and pull out a mundane item.",
    classes: null,
    data: {
      community: "Wanderborne",
      flavor: "Being part of a wanderborne community means you've lived as a nomad.",
      adjectives: ["inscrutable", "magnanimous", "mirthful", "reliable", "savvy", "unorthodox"],
    },
  },
];

// ─── Equipment mocks (compendium_items rows) ──────────────────

const mockPrimaryWeapons = [
  // 2H — Greatsword
  {
    id: "item-greatsword",
    name: "Greatsword",
    type: "weapon",
    description: "Tier 1 two-handed greatsword.",
    properties: {
      tier: 1,
      category: "Primary",
      type: "Two-Handed",
      primary_trait: "Strength",
      damage: "d10+3 phy",
      range: "Melee",
    },
    source: "Daggerheart SRD",
  },
  // 1H — Broadsword (will trigger secondary step)
  {
    id: "item-broadsword",
    name: "Broadsword",
    type: "weapon",
    description: "Tier 1 reliable one-handed sword.",
    properties: {
      tier: 1,
      category: "Primary",
      type: "One-Handed",
      primary_trait: "Agility",
      damage: "d8 phy",
      range: "Melee",
      feature: "Reliable: +1 to attack rolls",
    },
    source: "Daggerheart SRD",
  },
  // A tier-2 row to verify component-level tier filtering
  {
    id: "item-improved-broadsword",
    name: "Improved Broadsword",
    type: "weapon",
    description: "Tier 2 primary.",
    properties: { tier: 2, category: "Primary", type: "One-Handed", damage: "d8+3 phy" },
    source: "Daggerheart SRD",
  },
  // Tier-1 magic primary — must be filtered out for Warrior/Guardian (no
  // spellcast_trait), visible for spellcaster classes.
  {
    id: "item-hand-runes",
    name: "Hand Runes",
    type: "weapon",
    description: "Tier 1 magic one-handed weapon.",
    properties: {
      tier: 1,
      category: "Primary",
      type: "One-Handed",
      primary_trait: "Instinct",
      damage: "d10 mag",
      damage_type: "magic",
      range: "Very Close",
    },
    source: "Daggerheart SRD",
  },
];

const mockSecondaryWeapons = [
  {
    id: "item-shortsword",
    name: "Shortsword",
    type: "weapon",
    description: "Tier 1 secondary one-handed sword.",
    properties: {
      tier: 1,
      category: "Secondary",
      type: "One-Handed",
      primary_trait: "Agility",
      damage: "d8 phy",
      range: "Melee",
      feature: "Paired: +2 to primary weapon damage",
    },
    source: "Daggerheart SRD",
  },
  {
    id: "item-round-shield",
    name: "Round Shield",
    type: "weapon",
    description: "Tier 1 secondary shield.",
    properties: {
      tier: 1,
      category: "Secondary",
      type: "One-Handed",
      primary_trait: "Strength",
      damage: "d4 phy",
      range: "Melee",
      feature: "Protective: +1 to Armor Score",
    },
    source: "Daggerheart SRD",
  },
];

const mockArmors = [
  {
    id: "armor-gambeson",
    name: "Gambeson Armor",
    type: "armor",
    description: "Tier 1 armor. Flexible: +1 to Evasion",
    properties: { tier: 1, base_score: 3, thresholds: "5/11", feature: "Flexible: +1 to Evasion" },
    source: "Daggerheart SRD",
  },
  {
    id: "armor-leather",
    name: "Leather Armor",
    type: "armor",
    description: "A tier 1 armor.",
    properties: { tier: 1, base_score: 3, thresholds: "6/13", feature: null },
    source: "Daggerheart SRD",
  },
];

const mockConsumables = [
  {
    id: "consumable-minor-health",
    name: "Minor Health Potion",
    type: "consumable",
    description: "Clear 1d4 HP.",
    properties: { description: "Clear 1d4 HP." },
    source: "Daggerheart SRD",
  },
  {
    id: "consumable-minor-stamina",
    name: "Minor Stamina Potion",
    type: "consumable",
    description: "Clear 1d4 Stress.",
    properties: { description: "Clear 1d4 Stress." },
    source: "Daggerheart SRD",
  },
  // Unrelated consumable that must NOT appear on the potion pick step
  {
    id: "consumable-stride",
    name: "Stride Potion",
    type: "consumable",
    description: "+1 to next Agility Roll.",
    properties: {},
    source: "Daggerheart SRD",
  },
];

// Level-1 domain cards used to drive the Cards step. Warrior's domains are Blade + Bone,
// so the three Warrior-eligible cards below should appear when the player picks Warrior.
// A Sage card (Druid + Ranger only) is included to verify the class filter excludes it.
// A level-2 Bone card is included to verify the level filter excludes it.
const mockDomainCards = [
  {
    id: "card-whirlwind",
    name: "Whirlwind",
    ability_type: "domain_card",
    description: "Mark a Stress to attack all targets within Melee range.",
    level: 1,
    classes: ["Guardian", "Warrior"],
    source: "Daggerheart SRD",
    data: { domain: "Blade", card_type: "ability", recall_cost: 0 },
  },
  {
    id: "card-get-back-up",
    name: "Get Back Up",
    ability_type: "domain_card",
    description: "When you take Severe damage, mark a Stress to clear 1 HP instead.",
    level: 1,
    classes: ["Guardian", "Warrior"],
    source: "Daggerheart SRD",
    data: { domain: "Blade", card_type: "ability", recall_cost: 1 },
  },
  {
    id: "card-i-am-your-shield",
    name: "I Am Your Shield",
    ability_type: "domain_card",
    description: "When an ally within Close range takes damage, mark a Stress to take it for them.",
    level: 1,
    classes: ["Ranger", "Warrior"],
    source: "Daggerheart SRD",
    data: { domain: "Bone", card_type: "ability", recall_cost: 0 },
  },
  // Level-2 Bone card — must not appear on the level-1 picker
  {
    id: "card-strategic-approach",
    name: "Strategic Approach",
    ability_type: "domain_card",
    description: "Higher-tier Bone card.",
    level: 2,
    classes: ["Ranger", "Warrior"],
    source: "Daggerheart SRD",
    data: { domain: "Bone", card_type: "ability", recall_cost: 1 },
  },
  // Sage card (Druid + Ranger) — must not appear when class is Warrior
  {
    id: "card-soothing-breeze",
    name: "Soothing Breeze",
    ability_type: "domain_card",
    description: "Druid/Ranger only.",
    level: 1,
    classes: ["Druid", "Ranger"],
    source: "Daggerheart SRD",
    data: { domain: "Sage", card_type: "ability", recall_cost: 0 },
  },
];

const mockSubclassFeatures = [
  {
    id: "feat-brave-foundation",
    name: "Call of the Brave: Courage",
    ability_type: "subclass_feature",
    description:
      "When you fail a roll with Fear, you gain a Hope. When you succeed with Hope, you can mark a Stress to gain an additional Hope.",
    classes: ["Warrior"],
    data: { feature_category: "foundation_feature", subclass: "Call of the Brave" },
  },
  {
    id: "feat-brave-spec",
    name: "Call of the Brave: Battle-Hardened",
    ability_type: "subclass_feature",
    description: "Once per long rest, when you take damage, you can reduce that damage to 0.",
    classes: ["Warrior"],
    data: { feature_category: "specialization_feature", subclass: "Call of the Brave" },
  },
  {
    id: "feat-brave-mastery",
    name: "Call of the Brave: Unstoppable",
    ability_type: "subclass_feature",
    description: "While you have at least 1 Hit Point, you cannot be Restrained or Stunned.",
    classes: ["Warrior"],
    data: { feature_category: "mastery_feature", subclass: "Call of the Brave" },
  },
];

// Mock useStepData to return classes / subclasses / subclass features depending on config
let useStepDataCallCount = 0;
type MockedStepConfig = {
  dataSource?: { table?: string; filter?: Record<string, unknown> };
};
vi.mock("@/lib/character/use-step-data", () => ({
  useStepData: (
    config: MockedStepConfig | undefined,
    _systemId: unknown,
    dependValue?: unknown
  ) => {
    useStepDataCallCount++;
    const table = config?.dataSource?.table;
    const filter = config?.dataSource?.filter as Record<string, unknown> | undefined;

    // compendium_classes — base classes (no depend) or subclasses (with depend)
    if (table === "compendium_classes") {
      if (!dependValue) {
        return { data: mockClasses, loading: false, error: null };
      }
      return {
        data: mockSubclasses.filter((s) => s.parent_class_id === dependValue),
        loading: false,
        error: null,
      };
    }

    // compendium_abilities — subclass features filtered by parent class name
    if (table === "compendium_abilities" && filter?.ability_type === "subclass_feature") {
      if (!dependValue) return { data: [], loading: false, error: null };
      return {
        data: mockSubclassFeatures.filter((f) => f.classes.includes(dependValue as string)),
        loading: false,
        error: null,
      };
    }

    // compendium_abilities — class features (all classes, fetched up-front)
    if (table === "compendium_abilities" && filter?.ability_type === "class_feature") {
      return { data: mockClassFeatures, loading: false, error: null };
    }

    // compendium_abilities — ancestry features (fetched up-front, no dependency)
    if (table === "compendium_abilities" && filter?.ability_type === "ancestry_feature") {
      return { data: mockAncestryFeatures, loading: false, error: null };
    }

    // compendium_abilities — community features (fetched up-front, no dependency)
    if (table === "compendium_abilities" && filter?.ability_type === "community_feature") {
      return { data: mockCommunityFeatures, loading: false, error: null };
    }

    // compendium_abilities — domain cards filtered by chosen class name (`classes contains`)
    // and by level=1 in the static filter.
    if (table === "compendium_abilities" && filter?.ability_type === "domain_card") {
      if (!dependValue) return { data: [], loading: false, error: null };
      const lvl = filter?.level;
      return {
        data: mockDomainCards.filter(
          (c) =>
            c.classes.includes(dependValue as string) &&
            (lvl == null || c.level === lvl)
        ),
        loading: false,
        error: null,
      };
    }

    // compendium_items — return everything of the requested type. The component is
    // responsible for narrowing (e.g. to Tier 1 + category Primary) since `properties`
    // is a JSONB column that useStepData can't filter on directly.
    if (table === "compendium_items" && filter?.type === "weapon") {
      return {
        data: [...mockPrimaryWeapons, ...mockSecondaryWeapons],
        loading: false,
        error: null,
      };
    }
    if (table === "compendium_items" && filter?.type === "armor") {
      return { data: mockArmors, loading: false, error: null };
    }
    if (table === "compendium_items" && filter?.type === "consumable") {
      return { data: mockConsumables, loading: false, error: null };
    }

    return { data: [], loading: false, error: null };
  },
}));

vi.mock("@/lib/character/save-new-character", () => ({
  saveNewCharacter: vi.fn().mockResolvedValue({ characterId: "new-char-id" }),
}));

// handleCreate calls createClient() to look up the four basic-supply compendium ids
// before invoking saveNewCharacter. Return an empty supply list — the wizard's
// supply-resolution loop simply produces an empty basicSupplyIds map, which save
// then handles fine.
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            in: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
    }),
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ─── Tests ──────────────────────────────────────────────────

describe("CharacterWizard", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    campaignId: "campaign-1",
    systemId: "sys-dh",
    systemSlug: "daggerheart",
    userId: "user-1",
    wizardConfig: DAGGERHEART_WIZARD_CONFIG,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useStepDataCallCount = 0;
  });

  it("renders the class pick step first (the standalone name step was moved to the review screen)", () => {
    render(<CharacterWizard {...defaultProps} />);
    expect(screen.getByText("Choose Your Class")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<CharacterWizard {...defaultProps} open={false} />);
    expect(screen.queryByText("Choose Your Class")).not.toBeInTheDocument();
  });

  it("shows class cards on the first step", () => {
    render(<CharacterWizard {...defaultProps} />);
    expect(screen.getByText("Warrior")).toBeInTheDocument();
    expect(screen.getByText("Druid")).toBeInTheDocument();
  });

  it("shows progress bar with the new step labels (Behold replaces Name, no Review label)", () => {
    render(<CharacterWizard {...defaultProps} />);
    // Per-step labels (desktop) start at Class and end at Behold.
    expect(screen.getByText("Class")).toBeInTheDocument();
    expect(screen.getByText("Behold")).toBeInTheDocument();
    expect(screen.queryByText("Name")).not.toBeInTheDocument();
  });

  it("shows back button on subclass step (class pick is now the first step and has none)", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);
    await user.click(screen.getByText("Warrior"));
    await user.click(screen.getByRole("button", { name: /choose warrior/i }));
    expect(screen.getByText("Back")).toBeInTheDocument();
  });

  it("clicking a completed progress-bar label jumps the wizard to that step", async () => {
    // Without this shortcut, returning to Class from Ancestry takes 2 Back
    // clicks; with it, one click on the "Class" label in the progress bar.
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);

    // Walk to ancestry_pick.
    await user.click(screen.getByText("Warrior"));
    await user.click(screen.getByRole("button", { name: /choose warrior/i }));
    await user.click(screen.getByText("Call of the Brave"));
    await user.click(screen.getByRole("button", { name: /choose call of the brave/i }));
    expect(screen.getByText("Choose Your Ancestry")).toBeInTheDocument();

    // Click the "Class" label in the progress bar — should land back on class_pick.
    await user.click(screen.getByText("Class"));
    expect(screen.getByText("Choose Your Class")).toBeInTheDocument();
  });

  it("allows forward jumps to previously-visited steps after back-navigation", async () => {
    // Player walks to weapon_primary_pick, goes back to subclass to revise.
    // After picking a new subclass (same class — so high-water mark isn't
    // reset), the progress bar's "Primary Weapon" label remains clickable
    // and jumps the player straight back to that step.
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);

    // Walk through to weapon_primary_pick.
    await user.click(screen.getByText("Warrior"));
    await user.click(screen.getByRole("button", { name: /choose warrior/i }));
    await user.click(screen.getByText("Call of the Brave"));
    await user.click(screen.getByRole("button", { name: /choose call of the brave/i }));
    await user.click(screen.getByText("Katari"));
    await user.click(screen.getByRole("button", { name: /choose katari/i }));
    await user.click(screen.getByText("Wanderborne"));
    await user.click(screen.getByRole("button", { name: /choose wanderborne/i }));
    expect(screen.getByText(/Primary Weapon/i)).toBeInTheDocument();

    // Jump back to Subclass via the progress-bar label.
    await user.click(screen.getByText("Subclass"));
    expect(screen.getByText("Choose Your Path")).toBeInTheDocument();

    // Re-pick the same Warrior subclass to stay in-class (no state reset).
    await user.click(screen.getByText("Call of the Slayer"));
    await user.click(screen.getByRole("button", { name: /choose call of the slayer/i }));
    // The forward step now is ancestry_pick, but the "Weapon" progress-bar
    // label is still a visited step in maxStepReached — clicking it jumps there.
    await user.click(screen.getByText("Weapon"));
    expect(screen.getByText(/Choose Your Primary Weapon/i)).toBeInTheDocument();
  });

  it("clicking the current or a future progress-bar label is a no-op", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);

    // Currently on class_pick. Clicking "Class" (current) or "Subclass" (future)
    // must not change the step.
    await user.click(screen.getByText("Class"));
    expect(screen.getByText("Choose Your Class")).toBeInTheDocument();

    await user.click(screen.getByText("Subclass"));
    expect(screen.getByText("Choose Your Class")).toBeInTheDocument();
  });

  it("navigates back to class pick when back is clicked from subclass step", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);
    await user.click(screen.getByText("Warrior"));
    await user.click(screen.getByRole("button", { name: /choose warrior/i }));
    await user.click(screen.getByText("Back"));
    expect(screen.getByText("Choose Your Class")).toBeInTheDocument();
  });

  it("switching class clears the previous class's class_item selection", async () => {
    // Regression guard: classItemName is class-scoped (Warrior's "drawing of a
    // lover" vs Druid's "small bag of rocks and bones"). Picking a new class
    // must clear the previous selection — otherwise a Druid sheet could be
    // saved with a Warrior item attached. Without the fix, the Druid
    // class_item step would show the previous Warrior pick as data-selected
    // even though it doesn't appear in the Druid picker.
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);

    // Pick Warrior + a Warrior class item, then back-navigate to class_pick.
    await user.click(screen.getByText("Warrior"));
    await user.click(screen.getByRole("button", { name: /choose warrior/i }));
    await user.click(screen.getByText("Call of the Brave"));
    await user.click(screen.getByRole("button", { name: /choose call of the brave/i }));
    await user.click(screen.getByText("Katari"));
    await user.click(screen.getByRole("button", { name: /choose katari/i }));
    await user.click(screen.getByText("Wanderborne"));
    await user.click(screen.getByRole("button", { name: /choose wanderborne/i }));
    await user.click(screen.getByText("Greatsword"));
    await user.click(screen.getByRole("button", { name: /choose greatsword/i }));
    await user.click(screen.getByText("Gambeson Armor"));
    await user.click(screen.getByRole("button", { name: /choose gambeson armor/i }));
    await user.click(screen.getByText("Minor Health Potion"));
    await user.click(screen.getByRole("button", { name: /choose minor health potion/i }));
    await user.click(screen.getByText("The drawing of a lover"));
    await user.click(screen.getByRole("button", { name: /choose the drawing of a lover/i }));

    // 8 backs: class_item (idx 8) → potion → armor → weapon_primary → community → ancestry → subclass → class
    for (let i = 0; i < 8; i++) {
      await user.click(screen.getByText("Back"));
    }
    expect(screen.getByText("Choose Your Class")).toBeInTheDocument();

    // Switch to Druid.
    await user.click(screen.getByText("Druid"));
    await user.click(screen.getByRole("button", { name: /choose druid/i }));
    await user.click(screen.getByText("Warden of the Elements"));
    await user.click(screen.getByRole("button", { name: /choose warden of the elements/i }));

    // Walk forward through the same generic steps to land back on class_item.
    await user.click(screen.getByText("Katari"));
    await user.click(screen.getByRole("button", { name: /choose katari/i }));
    await user.click(screen.getByText("Wanderborne"));
    await user.click(screen.getByRole("button", { name: /choose wanderborne/i }));
    await user.click(screen.getByText("Greatsword"));
    await user.click(screen.getByRole("button", { name: /choose greatsword/i }));
    await user.click(screen.getByText("Gambeson Armor"));
    await user.click(screen.getByRole("button", { name: /choose gambeson armor/i }));
    await user.click(screen.getByText("Minor Health Potion"));
    await user.click(screen.getByRole("button", { name: /choose minor health potion/i }));

    // Druid's class_item options are visible — Warrior's are not, and no card is selected yet.
    expect(screen.getByText("A small bag of rocks and bones")).toBeInTheDocument();
    expect(screen.queryByText("The drawing of a lover")).not.toBeInTheDocument();
    const selectedCards = document.querySelectorAll("[data-card-id][data-selected]");
    expect(selectedCards).toHaveLength(0);
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<CharacterWizard {...defaultProps} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("class cards show Hope Feature and Class Feature with descriptions when expanded", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);

    // Step 1: enter name and advance to class pick

    // Expand the Warrior card
    await user.click(screen.getByText("Warrior"));

    // Hope Feature
    expect(screen.getByText("Hope Feature")).toBeInTheDocument();
    expect(screen.getByText("No Mercy")).toBeInTheDocument();
    expect(screen.getByText(/Spend 3 Hope to gain a \+1 bonus/)).toBeInTheDocument();

    // Class Feature
    expect(screen.getByText("Class Feature")).toBeInTheDocument();
    expect(screen.getByText("Attack of Opportunity")).toBeInTheDocument();
    expect(
      screen.getByText(/When an adversary within Melee range tries to leave/)
    ).toBeInTheDocument();
  });

  it("class cards show the two class domains with their SRD descriptions when expanded", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);

    // Expand Warrior — domains are Blade + Bone per SRD page 7.
    await user.click(screen.getByText("Warrior"));

    const detail = within(screen.getByTestId("card-picker-detail"));
    expect(detail.getByText("Domains")).toBeInTheDocument();
    // Domain name + tagline rendered together
    expect(detail.getByText(/Blade.*Weapon mastery/i)).toBeInTheDocument();
    expect(detail.getByText(/Bone.*Tactics and the body/i)).toBeInTheDocument();
    // Full description present
    expect(detail.getByText(/those who follow this path have the skill to cut short the lives of others/i)).toBeInTheDocument();
    expect(detail.getByText(/uncanny control over their own physical abilities/i)).toBeInTheDocument();
  });

  it("subclass cards show feature details and parent class stats when expanded", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);

    // Step 1: enter name

    // Step 2: pick Warrior
    await user.click(screen.getByText("Warrior"));
    await user.click(screen.getByRole("button", { name: /choose warrior/i }));

    // Step 3: should be on subclass pick — expand "Call of the Brave"
    expect(screen.getByText("Choose Your Path")).toBeInTheDocument();
    await user.click(screen.getByText("Call of the Brave"));

    // Parent class stat (Evasion 11 from Warrior) should appear on the subclass card
    expect(screen.getByText("Evasion")).toBeInTheDocument();
    expect(screen.getByText("11")).toBeInTheDocument();

    // Foundation feature
    expect(screen.getByText("Foundation Feature")).toBeInTheDocument();
    expect(screen.getByText("Courage")).toBeInTheDocument();
    expect(screen.getByText(/When you fail a roll with Fear/)).toBeInTheDocument();

    // Specialization feature
    expect(screen.getByText("Specialization Features")).toBeInTheDocument();
    expect(screen.getByText("Battle-Hardened")).toBeInTheDocument();

    // Mastery feature
    expect(screen.getByText("Mastery Features")).toBeInTheDocument();
    expect(screen.getByText("Unstoppable")).toBeInTheDocument();
  });

  // ─── Heritage step (ancestry + community card pickers) ─────

  it("ancestry step shows one card per ancestry (grouped by data.ancestry)", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);

    // Walk: name → class → subclass → ancestry
    await user.click(screen.getByText("Warrior"));
    await user.click(screen.getByRole("button", { name: /choose warrior/i }));
    await user.click(screen.getByText("Call of the Brave"));
    await user.click(screen.getByRole("button", { name: /choose call of the brave/i }));

    // Heritage step heading
    expect(screen.getByText("Choose Your Ancestry")).toBeInTheDocument();

    // Faerie + Katari each show up once as cards (mock has 4 feature rows → 2 ancestries)
    const faerieMatches = screen.getAllByText("Faerie");
    expect(faerieMatches.length).toBeGreaterThanOrEqual(1);
    const katariMatches = screen.getAllByText("Katari");
    expect(katariMatches.length).toBeGreaterThanOrEqual(1);
  });

  it("ancestry step shows a Female/Male portrait toggle", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);
    await user.click(screen.getByText("Warrior"));
    await user.click(screen.getByRole("button", { name: /choose warrior/i }));
    await user.click(screen.getByText("Call of the Brave"));
    await user.click(screen.getByRole("button", { name: /choose call of the brave/i }));

    // The radiogroup exposes two radios; Female is selected by default.
    // /^male$/i avoids "Female" matching the loose /male/i regex.
    const female = screen.getByRole("radio", { name: /^female$/i });
    const male = screen.getByRole("radio", { name: /^male$/i });
    expect(female).toHaveAttribute("aria-checked", "true");
    expect(male).toHaveAttribute("aria-checked", "false");

    await user.click(male);
    expect(female).toHaveAttribute("aria-checked", "false");
    expect(male).toHaveAttribute("aria-checked", "true");
  });

  it("toggling Female ↔ Male switches the ancestry card hero images", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);
    await user.click(screen.getByText("Warrior"));
    await user.click(screen.getByRole("button", { name: /choose warrior/i }));
    await user.click(screen.getByText("Call of the Brave"));
    await user.click(screen.getByRole("button", { name: /choose call of the brave/i }));

    // Faerie has both -f and -m portraits — both images come from public/ancestries.
    const faerieCard = screen.getByText("Faerie").closest("[data-card-id]") as HTMLElement;
    const faerieImg = () => within(faerieCard).getByAltText("Faerie");

    expect(faerieImg().getAttribute("src") ?? "").toMatch(/Faerie-f\.png/);

    await user.click(screen.getByRole("radio", { name: /^male$/i }));
    expect(faerieImg().getAttribute("src") ?? "").toMatch(/Faerie-m\.png/);
  });

  it("ancestry card shows both ancestry features with descriptions when expanded", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);

    await user.click(screen.getByText("Warrior"));
    await user.click(screen.getByRole("button", { name: /choose warrior/i }));
    await user.click(screen.getByText("Call of the Brave"));
    await user.click(screen.getByRole("button", { name: /choose call of the brave/i }));

    // Expand the Faerie card
    await user.click(screen.getByText("Faerie"));

    expect(screen.getByText("Luckbender")).toBeInTheDocument();
    expect(screen.getByText(/Once per session, after you or a willing ally/)).toBeInTheDocument();
    expect(screen.getByText("Wings")).toBeInTheDocument();
    expect(screen.getByText(/You can fly\. While flying/)).toBeInTheDocument();
  });

  it("community step shows one card per community with its feature", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);

    // Walk through to community step
    await user.click(screen.getByText("Warrior"));
    await user.click(screen.getByRole("button", { name: /choose warrior/i }));
    await user.click(screen.getByText("Call of the Brave"));
    await user.click(screen.getByRole("button", { name: /choose call of the brave/i }));
    // Pick Faerie as ancestry to advance to community step
    await user.click(screen.getByText("Faerie"));
    await user.click(screen.getByRole("button", { name: /choose faerie/i }));

    // Both communities should now be visible
    expect(screen.getByText("Highborne")).toBeInTheDocument();
    expect(screen.getByText("Wanderborne")).toBeInTheDocument();

    // Expand Highborne — should show its Privilege feature
    await user.click(screen.getByText("Highborne"));
    expect(screen.getByText("Privilege")).toBeInTheDocument();
    expect(screen.getByText(/advantage on rolls to consort with nobles/)).toBeInTheDocument();
  });

  it("ancestry cards inherit the selected class's gradient theme", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);

    // Walk to the ancestry step via Warrior (theme: from-red-950 via-rose-900)
    await user.click(screen.getByText("Warrior"));
    await user.click(screen.getByRole("button", { name: /choose warrior/i }));
    await user.click(screen.getByText("Call of the Brave"));
    await user.click(screen.getByRole("button", { name: /choose call of the brave/i }));

    // Ancestry cards should now be tinted with Warrior's theme
    const faerieCard = screen.getByText("Faerie").closest("[data-card-id]");
    expect(faerieCard?.className).toContain("from-red-950");
  });

  it("ancestry card expanded shows the SRD flavor description", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);

    await user.click(screen.getByText("Warrior"));
    await user.click(screen.getByRole("button", { name: /choose warrior/i }));
    await user.click(screen.getByText("Call of the Brave"));
    await user.click(screen.getByRole("button", { name: /choose call of the brave/i }));

    // Expand Faerie — the flavor paragraph should be visible in the detail panel
    await user.click(screen.getByText("Faerie"));
    const detail = within(screen.getByTestId("card-picker-detail"));
    expect(
      detail.getByText(/Faeries are winged humanoid creatures with insectile features/)
    ).toBeInTheDocument();
  });

  it("community card expanded shows both flavor and the personality adjectives", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);

    await user.click(screen.getByText("Warrior"));
    await user.click(screen.getByRole("button", { name: /choose warrior/i }));
    await user.click(screen.getByText("Call of the Brave"));
    await user.click(screen.getByRole("button", { name: /choose call of the brave/i }));
    await user.click(screen.getByText("Faerie"));
    await user.click(screen.getByRole("button", { name: /choose faerie/i }));

    // Expand Highborne
    await user.click(screen.getByText("Highborne"));
    const detail = within(screen.getByTestId("card-picker-detail"));

    // Flavor paragraph appears in the detail panel
    expect(
      detail.getByText(/Being part of a highborne community means you're accustomed to/)
    ).toBeInTheDocument();

    // All 6 personality adjectives render as chips in the detail panel
    expect(detail.getByText("Personality")).toBeInTheDocument();
    expect(detail.getByText("amiable")).toBeInTheDocument();
    expect(detail.getByText("candid")).toBeInTheDocument();
    expect(detail.getByText("conniving")).toBeInTheDocument();
    expect(detail.getByText("enterprising")).toBeInTheDocument();
    expect(detail.getByText("ostentatious")).toBeInTheDocument();
    expect(detail.getByText("unflappable")).toBeInTheDocument();
  });

  it("community cards inherit the selected class's gradient theme", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);

    await user.click(screen.getByText("Warrior"));
    await user.click(screen.getByRole("button", { name: /choose warrior/i }));
    await user.click(screen.getByText("Call of the Brave"));
    await user.click(screen.getByRole("button", { name: /choose call of the brave/i }));
    // Pick ancestry to advance to community step
    await user.click(screen.getByText("Faerie"));
    await user.click(screen.getByRole("button", { name: /choose faerie/i }));

    const highborneCard = screen.getByText("Highborne").closest("[data-card-id]");
    expect(highborneCard?.className).toContain("from-red-950");
  });

  it("selecting ancestry and community shows them in the review summary", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);

    // Full happy path — fastest viable inputs at each step
    await user.click(screen.getByText("Warrior"));
    await user.click(screen.getByRole("button", { name: /choose warrior/i }));
    await user.click(screen.getByText("Call of the Brave"));
    await user.click(screen.getByRole("button", { name: /choose call of the brave/i }));
    await user.click(screen.getByText("Katari"));
    await user.click(screen.getByRole("button", { name: /choose katari/i }));
    await user.click(screen.getByText("Wanderborne"));
    await user.click(screen.getByRole("button", { name: /choose wanderborne/i }));
    // Equipment phase — 2H weapon (skips secondary) → armor → potion → class item
    await user.click(screen.getByText("Greatsword"));
    await user.click(screen.getByRole("button", { name: /choose greatsword/i }));
    await user.click(screen.getByText("Gambeson Armor"));
    await user.click(screen.getByRole("button", { name: /choose gambeson armor/i }));
    await user.click(screen.getByText("Minor Health Potion"));
    await user.click(screen.getByRole("button", { name: /choose minor health potion/i }));
    await user.click(screen.getByText("The drawing of a lover"));
    await user.click(screen.getByRole("button", { name: /choose the drawing of a lover/i }));

    // Pick the SRD standard array for the 6 traits (+2, +1, +1, +0, +0, -1)
    const selects = screen.getAllByRole("combobox");
    const values = ["2", "1", "1", "0", "0", "-1"];
    for (let i = 0; i < selects.length; i++) {
      await user.selectOptions(selects[i], values[i]);
    }

    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Experiences step — enter two names then continue
    const expInputs = screen.getAllByRole("textbox");
    await user.type(expInputs[0], "High Priestess");
    await user.type(expInputs[1], "Sticky Fingers");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Cards step — pick two domain cards then continue to review
    await user.click(screen.getByText("Whirlwind"));
    await user.click(screen.getByRole("button", { name: /add whirlwind/i }));
    await user.click(screen.getByText("I Am Your Shield"));
    await user.click(screen.getByRole("button", { name: /add i am your shield/i }));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Preview banner tagline includes both ancestry + community (e.g. "a Katari Warrior of the Wanderborne")
    expect(screen.getByText(/Katari Warrior of the Wanderborne/i)).toBeInTheDocument();
  });

  // ─── Equipment phase (weapons + armor + potion + class item) ──

  /**
   * Walks the wizard up to (and including) selecting community, leaving the wizard
   * on the first equipment step (weapon_primary_pick). Keeps the equipment-flow
   * tests below readable instead of repeating the same 9-click preamble.
   */
  async function walkToEquipmentStart(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByText("Warrior"));
    await user.click(screen.getByRole("button", { name: /choose warrior/i }));
    await user.click(screen.getByText("Call of the Brave"));
    await user.click(screen.getByRole("button", { name: /choose call of the brave/i }));
    await user.click(screen.getByText("Katari"));
    await user.click(screen.getByRole("button", { name: /choose katari/i }));
    await user.click(screen.getByText("Wanderborne"));
    await user.click(screen.getByRole("button", { name: /choose wanderborne/i }));
  }

  it("weapon_primary_pick step renders Tier 1 primary weapons only (and hides magic for non-spellcaster classes)", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);
    await walkToEquipmentStart(user); // picks Warrior → no spellcast_trait

    // Step heading
    expect(screen.getByText(/Choose Your Primary Weapon|Pick Your Primary Weapon/i)).toBeInTheDocument();

    // Both Tier 1 physical primaries appear
    expect(screen.getByText("Greatsword")).toBeInTheDocument();
    expect(screen.getByText("Broadsword")).toBeInTheDocument();

    // Tier 2 primary must be filtered out
    expect(screen.queryByText("Improved Broadsword")).not.toBeInTheDocument();
    // Secondary weapons must not appear on the primary step
    expect(screen.queryByText("Shortsword")).not.toBeInTheDocument();
    expect(screen.queryByText("Round Shield")).not.toBeInTheDocument();
    // Magic weapons must be filtered out for Warrior (no spellcast_trait)
    expect(screen.queryByText("Hand Runes")).not.toBeInTheDocument();
  });

  it("weapon_primary_pick step shows magic weapons for spellcaster classes (Druid)", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);

    // Walk to weapon_primary_pick via Druid (spellcast_trait = "Instinct").
    // Druid only has one mock subclass (Warden of the Elements), so pick it.
    await user.click(screen.getByText("Druid"));
    await user.click(screen.getByRole("button", { name: /choose druid/i }));
    await user.click(screen.getByText("Warden of the Elements"));
    await user.click(screen.getByRole("button", { name: /choose warden of the elements/i }));
    await user.click(screen.getByText("Katari"));
    await user.click(screen.getByRole("button", { name: /choose katari/i }));
    await user.click(screen.getByText("Wanderborne"));
    await user.click(screen.getByRole("button", { name: /choose wanderborne/i }));

    // Both physical AND magic weapons appear for spellcasters
    expect(screen.getByText("Greatsword")).toBeInTheDocument();
    expect(screen.getByText("Broadsword")).toBeInTheDocument();
    expect(screen.getByText("Hand Runes")).toBeInTheDocument();
  });

  it("magic weapons render with a violet gradient and a 'Magic' badge (visual distinction)", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);

    // Druid path to reach the picker with magic weapons visible.
    await user.click(screen.getByText("Druid"));
    await user.click(screen.getByRole("button", { name: /choose druid/i }));
    await user.click(screen.getByText("Warden of the Elements"));
    await user.click(screen.getByRole("button", { name: /choose warden of the elements/i }));
    await user.click(screen.getByText("Katari"));
    await user.click(screen.getByRole("button", { name: /choose katari/i }));
    await user.click(screen.getByText("Wanderborne"));
    await user.click(screen.getByRole("button", { name: /choose wanderborne/i }));

    // Magic weapon card has a violet gradient (overrides class theme).
    const runesCard = screen.getByText("Hand Runes").closest("[data-card-id]");
    expect(runesCard?.className).toContain("from-violet-950");

    // Physical weapon card keeps the class theme — Druid is from-green-950.
    const greatswordCard = screen.getByText("Greatsword").closest("[data-card-id]");
    expect(greatswordCard?.className).toContain("from-green-950");
    expect(greatswordCard?.className).not.toContain("from-violet-950");

    // Magic weapon shows a "Magic" badge inside its card (compact view).
    expect(within(runesCard as HTMLElement).getByText("Magic")).toBeInTheDocument();
  });

  it("picking a Two-Handed primary skips the secondary step and lands on armor", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);
    await walkToEquipmentStart(user);

    // Pick the 2H Greatsword
    await user.click(screen.getByText("Greatsword"));
    await user.click(screen.getByRole("button", { name: /choose greatsword/i }));

    // Should land on armor_pick, not secondary
    expect(screen.queryByText("Shortsword")).not.toBeInTheDocument();
    expect(screen.queryByText("Round Shield")).not.toBeInTheDocument();
    expect(screen.getByText("Gambeson Armor")).toBeInTheDocument();
    expect(screen.getByText("Leather Armor")).toBeInTheDocument();
  });

  it("picking a One-Handed primary shows the secondary weapon step", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);
    await walkToEquipmentStart(user);

    await user.click(screen.getByText("Broadsword"));
    await user.click(screen.getByRole("button", { name: /choose broadsword/i }));

    // Secondary picker appears with both secondaries
    expect(screen.getByText("Shortsword")).toBeInTheDocument();
    expect(screen.getByText("Round Shield")).toBeInTheDocument();
  });

  it("after picking a secondary, advances to armor_pick", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);
    await walkToEquipmentStart(user);

    await user.click(screen.getByText("Broadsword"));
    await user.click(screen.getByRole("button", { name: /choose broadsword/i }));
    await user.click(screen.getByText("Shortsword"));
    await user.click(screen.getByRole("button", { name: /choose shortsword/i }));

    expect(screen.getByText("Gambeson Armor")).toBeInTheDocument();
    expect(screen.getByText("Leather Armor")).toBeInTheDocument();
  });

  it("armor_pick renders Tier 1 armor only and advances to potion_pick", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);
    await walkToEquipmentStart(user);

    // 2H primary → skip secondary → armor
    await user.click(screen.getByText("Greatsword"));
    await user.click(screen.getByRole("button", { name: /choose greatsword/i }));

    expect(screen.getByText("Gambeson Armor")).toBeInTheDocument();
    expect(screen.getByText("Leather Armor")).toBeInTheDocument();

    await user.click(screen.getByText("Gambeson Armor"));
    await user.click(screen.getByRole("button", { name: /choose gambeson armor/i }));

    // Should land on potion pick — only Minor Health + Minor Stamina
    expect(screen.getByText("Minor Health Potion")).toBeInTheDocument();
    expect(screen.getByText("Minor Stamina Potion")).toBeInTheDocument();
    // The unrelated consumable must be filtered out in-component
    expect(screen.queryByText("Stride Potion")).not.toBeInTheDocument();
  });

  it("potion_pick advances to class_item_pick showing the 2 SRD options for the chosen class", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);
    await walkToEquipmentStart(user);

    await user.click(screen.getByText("Greatsword"));
    await user.click(screen.getByRole("button", { name: /choose greatsword/i }));
    await user.click(screen.getByText("Gambeson Armor"));
    await user.click(screen.getByRole("button", { name: /choose gambeson armor/i }));
    await user.click(screen.getByText("Minor Health Potion"));
    await user.click(screen.getByRole("button", { name: /choose minor health potion/i }));

    // Warrior was picked at class step → class_item_pick shows the 2 Warrior class items
    expect(screen.getByText("The drawing of a lover")).toBeInTheDocument();
    expect(screen.getByText("A sharpening stone")).toBeInTheDocument();
  });

  it("class_item_pick advances to the traits step after a selection", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);
    await walkToEquipmentStart(user);

    await user.click(screen.getByText("Greatsword"));
    await user.click(screen.getByRole("button", { name: /choose greatsword/i }));
    await user.click(screen.getByText("Gambeson Armor"));
    await user.click(screen.getByRole("button", { name: /choose gambeson armor/i }));
    await user.click(screen.getByText("Minor Health Potion"));
    await user.click(screen.getByRole("button", { name: /choose minor health potion/i }));
    await user.click(screen.getByText("The drawing of a lover"));
    await user.click(screen.getByRole("button", { name: /choose the drawing of a lover/i }));

    // Traits step has a heading containing "Assign" or "Trait"
    expect(screen.getByText(/Assign Traits/i)).toBeInTheDocument();
  });

  it("equipment selections appear in the review summary", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);
    await walkToEquipmentStart(user);

    // Pick 1H primary + secondary to verify both render in review
    await user.click(screen.getByText("Broadsword"));
    await user.click(screen.getByRole("button", { name: /choose broadsword/i }));
    await user.click(screen.getByText("Round Shield"));
    await user.click(screen.getByRole("button", { name: /choose round shield/i }));
    await user.click(screen.getByText("Gambeson Armor"));
    await user.click(screen.getByRole("button", { name: /choose gambeson armor/i }));
    await user.click(screen.getByText("Minor Stamina Potion"));
    await user.click(screen.getByRole("button", { name: /choose minor stamina potion/i }));
    await user.click(screen.getByText("A sharpening stone"));
    await user.click(screen.getByRole("button", { name: /choose a sharpening stone/i }));

    // Assign standard array
    const selects = screen.getAllByRole("combobox");
    const values = ["2", "1", "1", "0", "0", "-1"];
    for (let i = 0; i < selects.length; i++) {
      await user.selectOptions(selects[i], values[i]);
    }
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Walk through the Experiences step before reaching review
    const expInputs = screen.getAllByRole("textbox");
    await user.type(expInputs[0], "Soldier");
    await user.type(expInputs[1], "Hold the Line");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Cards step — pick two domain cards then continue
    await user.click(screen.getByText("Whirlwind"));
    await user.click(screen.getByRole("button", { name: /add whirlwind/i }));
    await user.click(screen.getByText("I Am Your Shield"));
    await user.click(screen.getByRole("button", { name: /add i am your shield/i }));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Preview sheet should mention each equipment selection (weapons + armor + inventory).
    expect(screen.getByText("Broadsword")).toBeInTheDocument();
    expect(screen.getByText("Round Shield")).toBeInTheDocument();
    expect(screen.getByText("Gambeson Armor")).toBeInTheDocument();
    expect(screen.getByText(/Minor Stamina Potion/)).toBeInTheDocument();
    expect(screen.getByText(/A sharpening stone/)).toBeInTheDocument();
  });

  it("equipment cards inherit the selected class's gradient theme", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);
    await walkToEquipmentStart(user);

    // Warrior's theme starts with "from-red-950"
    const greatswordCard = screen.getByText("Greatsword").closest("[data-card-id]");
    expect(greatswordCard?.className).toContain("from-red-950");
  });

  // ─── Experiences step (SRD step 7) ─────────────────────────

  /**
   * Walks the wizard from the start through to the Experiences step.
   * Leaves the wizard with traits assigned and the Continue button click
   * having landed on `experiences_pick`.
   */
  async function walkToExperiences(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByText("Warrior"));
    await user.click(screen.getByRole("button", { name: /choose warrior/i }));
    await user.click(screen.getByText("Call of the Brave"));
    await user.click(screen.getByRole("button", { name: /choose call of the brave/i }));
    await user.click(screen.getByText("Katari"));
    await user.click(screen.getByRole("button", { name: /choose katari/i }));
    await user.click(screen.getByText("Wanderborne"));
    await user.click(screen.getByRole("button", { name: /choose wanderborne/i }));
    // Equipment phase — 2H weapon skips secondary
    await user.click(screen.getByText("Greatsword"));
    await user.click(screen.getByRole("button", { name: /choose greatsword/i }));
    await user.click(screen.getByText("Gambeson Armor"));
    await user.click(screen.getByRole("button", { name: /choose gambeson armor/i }));
    await user.click(screen.getByText("Minor Health Potion"));
    await user.click(screen.getByRole("button", { name: /choose minor health potion/i }));
    await user.click(screen.getByText("The drawing of a lover"));
    await user.click(screen.getByRole("button", { name: /choose the drawing of a lover/i }));

    // Assign the standard array to get past the traits step
    const selects = screen.getAllByRole("combobox");
    const values = ["2", "1", "1", "0", "0", "-1"];
    for (let i = 0; i < selects.length; i++) {
      await user.selectOptions(selects[i], values[i]);
    }
    await user.click(screen.getByRole("button", { name: "Continue" }));
  }

  it("Experiences step appears after Traits with two empty text inputs", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);
    await walkToExperiences(user);

    // Step heading
    expect(screen.getByText(/Create Your Experiences/i)).toBeInTheDocument();

    // Two empty text inputs for the two experience names
    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(2);
    expect((inputs[0] as HTMLInputElement).value).toBe("");
    expect((inputs[1] as HTMLInputElement).value).toBe("");
  });

  it("Continue on the Experiences step is disabled until both names are filled", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);
    await walkToExperiences(user);

    const continueBtn = screen.getByRole("button", { name: "Continue" });
    expect(continueBtn).toBeDisabled();

    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "Assassin");
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();

    await user.type(inputs[1], "Bookworm");
    expect(screen.getByRole("button", { name: "Continue" })).not.toBeDisabled();
  });

  it("Experience names entered show up in the review summary with +2", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);
    await walkToExperiences(user);

    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "High Priestess");
    await user.type(inputs[1], "Sticky Fingers");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Cards step — pick two domain cards then continue to review
    await user.click(screen.getByText("Whirlwind"));
    await user.click(screen.getByRole("button", { name: /add whirlwind/i }));
    await user.click(screen.getByText("I Am Your Shield"));
    await user.click(screen.getByRole("button", { name: /add i am your shield/i }));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Both experience names appear in the review
    expect(screen.getByText("High Priestess")).toBeInTheDocument();
    expect(screen.getByText("Sticky Fingers")).toBeInTheDocument();

    // "+2" modifier appears for each experience in the review (one per experience).
    // Note: an "Experiences" label also appears in the progress bar, so we don't
    // assert getByText for it — the names + +2 already imply the section rendered.
    expect(screen.getAllByText("+2").length).toBeGreaterThanOrEqual(2);
  });

  // ─── Domain Cards step (SRD step 8) ────────────────────────

  /**
   * Walks the wizard from the start through to the Cards step, picking Warrior
   * + Greatsword + Gambeson + Minor Health + "The drawing of a lover" along
   * the way. Leaves the wizard sitting on the freshly-entered Cards step with
   * no domain cards picked yet.
   */
  async function walkToCards(user: ReturnType<typeof userEvent.setup>) {
    await walkToExperiences(user);
    const expInputs = screen.getAllByRole("textbox");
    await user.type(expInputs[0], "Soldier");
    await user.type(expInputs[1], "Hold the Line");
    await user.click(screen.getByRole("button", { name: "Continue" }));
  }

  it("Cards step appears after Experiences", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);
    await walkToCards(user);

    expect(screen.getByText(/Choose Your Domain Cards|Domain Cards/i)).toBeInTheDocument();
  });

  it("Cards step shows only level-1 domain cards for the chosen class's domains", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);
    await walkToCards(user);

    // Warrior gets Blade (Whirlwind, Get Back Up) + Bone (I Am Your Shield)
    expect(screen.getByText("Whirlwind")).toBeInTheDocument();
    expect(screen.getByText("Get Back Up")).toBeInTheDocument();
    expect(screen.getByText("I Am Your Shield")).toBeInTheDocument();

    // Level-2 Bone card must be filtered out
    expect(screen.queryByText("Strategic Approach")).not.toBeInTheDocument();
    // Sage-only card (Druid/Ranger) must not appear for Warrior
    expect(screen.queryByText("Soothing Breeze")).not.toBeInTheDocument();
  });

  it("Continue is disabled on the Cards step until 2 cards are picked", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);
    await walkToCards(user);

    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();

    // Pick 1 — still disabled
    await user.click(screen.getByText("Whirlwind"));
    await user.click(screen.getByRole("button", { name: /add whirlwind/i }));
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();

    // Pick a 2nd — enabled
    await user.click(screen.getByText("I Am Your Shield"));
    await user.click(screen.getByRole("button", { name: /add i am your shield/i }));
    expect(screen.getByRole("button", { name: "Continue" })).not.toBeDisabled();
  });

  it("disables the Add button on the 3rd unselected card once 2 are picked", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);
    await walkToCards(user);

    await user.click(screen.getByText("Whirlwind"));
    await user.click(screen.getByRole("button", { name: /add whirlwind/i }));
    await user.click(screen.getByText("I Am Your Shield"));
    await user.click(screen.getByRole("button", { name: /add i am your shield/i }));

    // Expand the third (unselected) card — its Add button should be disabled
    await user.click(screen.getByText("Get Back Up"));
    expect(screen.getByRole("button", { name: /add get back up/i })).toBeDisabled();
  });

  it("picked domain cards appear on the preview sheet in the Domain Cards section", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);
    await walkToCards(user);

    await user.click(screen.getByText("Whirlwind"));
    await user.click(screen.getByRole("button", { name: /add whirlwind/i }));
    await user.click(screen.getByText("I Am Your Shield"));
    await user.click(screen.getByRole("button", { name: /add i am your shield/i }));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText("Whirlwind")).toBeInTheDocument();
    expect(screen.getByText("I Am Your Shield")).toBeInTheDocument();
  });

  it("picked domain cards are passed to saveNewCharacter on Create", async () => {
    const { saveNewCharacter } = await import("@/lib/character/save-new-character");
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);
    await walkToCards(user);

    await user.click(screen.getByText("Whirlwind"));
    await user.click(screen.getByRole("button", { name: /add whirlwind/i }));
    await user.click(screen.getByText("I Am Your Shield"));
    await user.click(screen.getByRole("button", { name: /add i am your shield/i }));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Preview screen now hosts the name input — Create CTA is disabled until name is non-empty.
    await user.type(screen.getByPlaceholderText(/name your hero/i), "Kael");
    await user.click(screen.getByRole("button", { name: /start your adventure/i }));

    await waitFor(() => {
      expect(saveNewCharacter).toHaveBeenCalled();
    });
    const call = (saveNewCharacter as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][0] as {
      domainCards?: Array<{ id: string }>;
    };
    expect(call.domainCards).toBeDefined();
    expect(call.domainCards?.map((c) => c.id).sort()).toEqual(
      ["card-i-am-your-shield", "card-whirlwind"].sort()
    );
  });
});
