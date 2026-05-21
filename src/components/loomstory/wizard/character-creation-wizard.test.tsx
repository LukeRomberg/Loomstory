import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// vi.mock is hoisted to the top of the file before any const declarations, so
// any variables the mock factories close over must be hoisted too — wrap the
// shared spies with vi.hoisted() so they exist at hoist time.
const { mockPush, mockToastSuccess, mockToastError, mockSaveNewCharacter } =
  vi.hoisted(() => ({
    mockPush: vi.fn(),
    mockToastSuccess: vi.fn(),
    mockToastError: vi.fn(),
    mockSaveNewCharacter: vi.fn(async () => ({ characterId: "char-1" })),
  }));

vi.mock("@/hooks/use-transition-router", () => ({
  useTransitionRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}));

// Supabase client mock — handleCreate only uses it to look up the four basic
// starting-supply ids by name. Return an empty supply list so saveNewCharacter
// skips that branch entirely.
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ in: () => ({ data: [], error: null }) }),
        }),
      }),
    }),
  }),
}));

// saveNewCharacter is unit-tested elsewhere; spy on it here so we can assert
// the wizard wires the right wizardState + selections through on save.
vi.mock("@/lib/character/save-new-character", () => ({
  saveNewCharacter: (params: unknown) => mockSaveNewCharacter(params),
}));

beforeEach(() => {
  mockPush.mockClear();
  mockToastSuccess.mockClear();
  mockToastError.mockClear();
  mockSaveNewCharacter.mockClear();
  mockSaveNewCharacter.mockImplementation(async () => ({
    characterId: "char-1",
  }));
});

const {
  mockClasses,
  mockClassFeatures,
  mockSubclasses,
  mockSubclassFeatures,
  mockAncestryFeatures,
  mockCommunityFeatures,
  mockWeapons,
  mockArmor,
  mockPotions,
  mockDomainCards,
} = vi.hoisted(() => ({
  mockClasses: [
    {
      id: "c1",
      name: "Warrior",
      is_subclass: false,
      parent_class_id: null,
      hp_die: "d10",
      data: {
        description: "Disciplined fighters with steel and grit.",
        hp_slots: 6,
        evasion: 11,
        hp_die: "d10",
        // No spellcast_trait → magic weapons must be filtered out for Warrior.
      },
      source: "Daggerheart SRD",
    },
    {
      id: "c2",
      name: "Wizard",
      is_subclass: false,
      parent_class_id: null,
      hp_die: "d6",
      data: {},
      source: "Daggerheart SRD",
    },
  ],
  mockClassFeatures: [
    {
      id: "f1",
      name: "Warrior: Attack of Opportunity",
      ability_type: "class_feature",
      description: "Strike when an enemy moves past you.",
      level: 1,
      classes: ["Warrior"],
      source: null,
      data: { feature_category: "class_feature" },
    },
    {
      id: "f2",
      name: "Warrior: No Mercy",
      ability_type: "class_feature",
      description: "Spend Hope to do X.",
      level: 1,
      classes: ["Warrior"],
      source: null,
      data: { feature_category: "hope_feature" },
    },
  ],
  mockSubclasses: [
    {
      id: "s1",
      name: "Call of the Brave",
      is_subclass: true,
      parent_class_id: "c1",
      hp_die: null,
      data: { description: "Brave Warriors charge ahead." },
      source: "Daggerheart SRD",
    },
    {
      id: "s2",
      name: "Call of the Slayer",
      is_subclass: true,
      parent_class_id: "c1",
      hp_die: null,
      data: { description: "Slayer Warriors are precise killers." },
      source: "Daggerheart SRD",
    },
    {
      id: "s3",
      name: "School of Knowledge",
      is_subclass: true,
      parent_class_id: "c2",
      hp_die: null,
      data: { description: "Knowledge wizards know everything." },
      source: "Daggerheart SRD",
    },
  ],
  mockSubclassFeatures: [
    {
      id: "sf1",
      name: "Call of the Brave: Battle-Hardened",
      ability_type: "subclass_feature",
      description: "Take less damage when bloodied.",
      level: 1,
      classes: ["Warrior"],
      source: null,
      data: { subclass: "Call of the Brave", feature_category: "foundation_feature" },
    },
    {
      id: "sf2",
      name: "Call of the Brave: Rallying Cry",
      ability_type: "subclass_feature",
      description: "Inspire your allies.",
      level: 5,
      classes: ["Warrior"],
      source: null,
      data: { subclass: "Call of the Brave", feature_category: "specialization_feature" },
    },
    {
      id: "sf3",
      name: "Call of the Brave: Unbreakable",
      ability_type: "subclass_feature",
      description: "You cannot be felled.",
      level: 8,
      classes: ["Warrior"],
      source: null,
      data: { subclass: "Call of the Brave", feature_category: "mastery_feature" },
    },
    {
      id: "sf4",
      name: "Call of the Slayer: Killer Instinct",
      ability_type: "subclass_feature",
      description: "Strike first, ask questions later.",
      level: 1,
      classes: ["Warrior"],
      source: null,
      data: { subclass: "Call of the Slayer", feature_category: "foundation_feature" },
    },
  ],
  mockAncestryFeatures: [
    {
      id: "af1",
      name: "Faerie: Luckbringer",
      ability_type: "ancestry_feature",
      description: "Re-roll a Hope die once per session.",
      level: null,
      classes: null,
      source: null,
      data: { ancestry: "Faerie", flavor: "Tiny winged beings of mischief." },
    },
    {
      id: "af2",
      name: "Faerie: Wings",
      ability_type: "ancestry_feature",
      description: "You can fly short distances.",
      level: null,
      classes: null,
      source: null,
      data: { ancestry: "Faerie", flavor: "Tiny winged beings of mischief." },
    },
    {
      id: "af3",
      name: "Clank: Purposeful Design",
      ability_type: "ancestry_feature",
      description: "Gain a +1 to a chosen trait.",
      level: null,
      classes: null,
      source: null,
      data: { ancestry: "Clank", flavor: "Mechanical beings of purpose." },
    },
    {
      id: "af4",
      name: "Clank: Efficient",
      ability_type: "ancestry_feature",
      description: "Mark Stress to repeat an Experience roll.",
      level: null,
      classes: null,
      source: null,
      data: { ancestry: "Clank", flavor: "Mechanical beings of purpose." },
    },
  ],
  mockCommunityFeatures: [
    {
      id: "cf1",
      name: "Highborne: Privilege",
      ability_type: "community_feature",
      description: "You have a +1 to Presence rolls with nobility.",
      level: null,
      classes: null,
      source: null,
      data: {
        community: "Highborne",
        flavor: "Born to wealth and influence.",
        adjectives: ["Refined", "Demanding"],
      },
    },
    {
      id: "cf2",
      name: "Wanderborne: Nomadic Eye",
      ability_type: "community_feature",
      description: "You always know which way is north.",
      level: null,
      classes: null,
      source: null,
      data: {
        community: "Wanderborne",
        flavor: "Roamers of the wild roads.",
      },
    },
  ],
  mockWeapons: [
    {
      id: "w1",
      name: "Broadsword",
      type: "weapon",
      description: "A classic one-handed blade.",
      properties: {
        tier: 1,
        category: "Primary",
        type: "One-Handed",
        damage: "d8+1 phy",
        range: "Melee",
        primary_trait: "Agility",
        feature: "Reliable: +1 to attack rolls.",
        damage_type: "physical",
      },
      source: "Daggerheart SRD",
    },
    {
      id: "w2",
      name: "Battleaxe",
      type: "weapon",
      description: "A two-handed axe.",
      properties: {
        tier: 1,
        category: "Primary",
        type: "Two-Handed",
        damage: "d10+3 phy",
        range: "Melee",
        primary_trait: "Strength",
        damage_type: "physical",
      },
      source: "Daggerheart SRD",
    },
    {
      id: "w3",
      name: "Hallowed Axe",
      type: "weapon",
      description: "A magically attuned axe.",
      properties: {
        tier: 1,
        category: "Primary",
        type: "One-Handed",
        damage: "d8+1 mag",
        range: "Melee",
        primary_trait: "Knowledge",
        damage_type: "magic",
      },
      source: "Daggerheart SRD",
    },
    {
      id: "w4",
      name: "Round Shield",
      type: "weapon",
      description: "A simple wooden shield.",
      properties: {
        tier: 1,
        category: "Secondary",
        type: "One-Handed",
        feature: "Protective: +1 to Armor Score.",
        damage_type: "physical",
      },
      source: "Daggerheart SRD",
    },
    {
      id: "w5",
      name: "Greataxe",
      type: "weapon",
      // Tier 2 — must be filtered out of the level-1 picker.
      description: "A masterwork two-handed axe.",
      properties: {
        tier: 2,
        category: "Primary",
        type: "Two-Handed",
        damage: "d12+3 phy",
        range: "Melee",
        damage_type: "physical",
      },
      source: "Daggerheart SRD",
    },
  ],
  mockArmor: [
    {
      id: "a1",
      name: "Gambeson Armor",
      type: "armor",
      description: "Quilted cloth armor.",
      properties: {
        tier: 1,
        base_score: 3,
        thresholds: "5 / 11",
        feature: "Flexible: +1 to Evasion.",
      },
      source: "Daggerheart SRD",
    },
    {
      id: "a2",
      name: "Leather Armor",
      type: "armor",
      description: "Sturdy hide armor.",
      properties: {
        tier: 1,
        base_score: 3,
        thresholds: "6 / 13",
      },
      source: "Daggerheart SRD",
    },
    {
      id: "a3",
      name: "Plate Armor",
      type: "armor",
      // Tier 2 — must be filtered out.
      description: "Heavy plate armor.",
      properties: { tier: 2, base_score: 4, thresholds: "8 / 17" },
      source: "Daggerheart SRD",
    },
  ],
  mockPotions: [
    {
      id: "p1",
      name: "Minor Health Potion",
      type: "consumable",
      description: "Drink to clear 1d4 Hit Points.",
      properties: { tier: 1 },
      source: "Daggerheart SRD",
    },
    {
      id: "p2",
      name: "Minor Stamina Potion",
      type: "consumable",
      description: "Drink to clear 1d4 Stress.",
      properties: { tier: 1 },
      source: "Daggerheart SRD",
    },
    {
      id: "p3",
      name: "Elixir of Hope",
      // Not a "starting" potion — must be filtered out.
      type: "consumable",
      description: "Restores Hope.",
      properties: { tier: 2 },
      source: "Daggerheart SRD",
    },
  ],
  mockDomainCards: [
    {
      id: "dc1",
      name: "Reckless Slash",
      ability_type: "domain_card",
      description: "Make an attack with advantage but take +1 Stress.",
      level: 1,
      classes: ["Warrior", "Guardian"],
      source: "Daggerheart SRD",
      data: { domain: "Blade", recall_cost: 1, card_type: "Ability" },
    },
    {
      id: "dc2",
      name: "Get Back Up",
      ability_type: "domain_card",
      description: "Clear a Hit Point.",
      level: 1,
      classes: ["Warrior", "Guardian"],
      source: "Daggerheart SRD",
      data: { domain: "Blade", recall_cost: 0, card_type: "Ability" },
    },
    {
      id: "dc3",
      name: "Bone Sense",
      ability_type: "domain_card",
      description: "Predict an enemy's move; gain advantage on your next roll.",
      level: 1,
      classes: ["Warrior", "Ranger"],
      source: "Daggerheart SRD",
      data: { domain: "Bone", recall_cost: 1, card_type: "Ability" },
    },
    {
      id: "dc4",
      name: "Whirling Strike",
      ability_type: "domain_card",
      description: "Hit every adjacent enemy.",
      level: 1,
      classes: ["Warrior"],
      source: "Daggerheart SRD",
      data: { domain: "Bone", recall_cost: 2, card_type: "Ability" },
    },
  ],
}));

vi.mock("@/lib/character/use-step-data", () => ({
  useStepData: (
    step:
      | {
          component?: string;
          dataSource?: { table?: string; filter?: Record<string, unknown> };
        }
      | undefined,
    _systemId?: string,
    dependValue?: string | null
  ) => {
    const filter = step?.dataSource?.filter ?? {};
    // Classes (parent classes only)
    if (step?.dataSource?.table === "compendium_classes" && filter.is_subclass === false) {
      return { data: mockClasses, loading: false, error: null };
    }
    // Subclasses — narrow by parent_class_id from the dependsOn class_pick selection
    if (step?.dataSource?.table === "compendium_classes" && filter.is_subclass === true) {
      const rows = dependValue
        ? mockSubclasses.filter((s) => s.parent_class_id === dependValue)
        : [];
      return { data: rows, loading: false, error: null };
    }
    // Synthetic subclass-feature fetch (ability_type subclass_feature)
    if (
      step?.dataSource?.table === "compendium_abilities" &&
      filter.ability_type === "subclass_feature"
    ) {
      return { data: mockSubclassFeatures, loading: false, error: null };
    }
    // Ancestry features
    if (
      step?.dataSource?.table === "compendium_abilities" &&
      filter.ability_type === "ancestry_feature"
    ) {
      return { data: mockAncestryFeatures, loading: false, error: null };
    }
    // Community features
    if (
      step?.dataSource?.table === "compendium_abilities" &&
      filter.ability_type === "community_feature"
    ) {
      return { data: mockCommunityFeatures, loading: false, error: null };
    }
    // Domain cards — filtered by ability_type + level, dependsOn the picked
    // class's name (passed in as `dependValue`).
    if (
      step?.dataSource?.table === "compendium_abilities" &&
      filter.ability_type === "domain_card"
    ) {
      const rows = dependValue
        ? mockDomainCards.filter((c) => c.classes.includes(dependValue))
        : [];
      return { data: rows, loading: false, error: null };
    }
    // Equipment (compendium_items) — narrow by `type` filter.
    if (step?.dataSource?.table === "compendium_items") {
      if (filter.type === "weapon") {
        return { data: mockWeapons, loading: false, error: null };
      }
      if (filter.type === "armor") {
        return { data: mockArmor, loading: false, error: null };
      }
      if (filter.type === "consumable") {
        return { data: mockPotions, loading: false, error: null };
      }
    }
    // Fallback — class features (no dataSource configured in the existing wizard).
    return { data: mockClassFeatures, loading: false, error: null };
  },
}));

import { CharacterCreationWizard } from "./character-creation-wizard";
import type { WizardConfig } from "@/lib/character/wizard-types";

const wizardConfig: WizardConfig = {
  steps: {
    class_pick: {
      enabled: true,
      label: "Choose Your Class",
      subtitle: "A defining path",
      shortLabel: "Class",
      component: "card_picker",
      dataSource: {
        table: "compendium_classes",
        filter: { is_subclass: false },
      },
    },
    subclass_pick: {
      enabled: true,
      label: "Choose a Subclass",
      subtitle: "Pick a path",
      shortLabel: "Subclass",
      component: "card_picker",
      dataSource: {
        table: "compendium_classes",
        filter: { is_subclass: true },
        dependsOn: "class_pick",
        dependColumn: "parent_class_id",
      },
    },
    ancestry_pick: {
      enabled: true,
      label: "Choose Your Ancestry",
      subtitle: "Your lineage",
      shortLabel: "Ancestry",
      component: "card_picker",
      dataSource: {
        table: "compendium_abilities",
        filter: { ability_type: "ancestry_feature" },
      },
    },
    community_pick: {
      enabled: true,
      label: "Choose Your Community",
      subtitle: "Your upbringing",
      shortLabel: "Community",
      component: "card_picker",
      dataSource: {
        table: "compendium_abilities",
        filter: { ability_type: "community_feature" },
      },
    },
    weapon_primary_pick: {
      enabled: true,
      label: "Choose Your Primary Weapon",
      subtitle: "Either two-handed, or pair with a secondary.",
      shortLabel: "Weapon",
      component: "card_picker",
      dataSource: {
        table: "compendium_items",
        filter: { type: "weapon" },
      },
    },
    weapon_secondary_pick: {
      enabled: true,
      label: "Choose Your Secondary Weapon",
      subtitle: "Pair it with your primary one-handed weapon.",
      shortLabel: "Secondary",
      component: "card_picker",
      dataSource: {
        table: "compendium_items",
        filter: { type: "weapon" },
      },
      showWhen: {
        requiresState: { key: "primaryWeaponIsTwoHanded", equals: false },
      },
    },
    armor_pick: {
      enabled: true,
      label: "Choose Your Armor",
      subtitle: "Set your damage thresholds and Armor Score.",
      shortLabel: "Armor",
      component: "card_picker",
      dataSource: {
        table: "compendium_items",
        filter: { type: "armor" },
      },
    },
    potion_pick: {
      enabled: true,
      label: "Choose a Starting Potion",
      subtitle: "Bring a Minor Health or Minor Stamina Potion.",
      shortLabel: "Potion",
      component: "card_picker",
      dataSource: {
        table: "compendium_items",
        filter: { type: "consumable" },
      },
    },
    class_item_pick: {
      enabled: true,
      label: "Choose Your Class Item",
      subtitle: "A meaningful object from your past.",
      shortLabel: "Class Item",
      component: "card_picker",
    },
    traits: {
      enabled: true,
      label: "Assign Traits",
      subtitle: "Distribute the standard array.",
      shortLabel: "Traits",
      component: "stat_assigner",
      config: {
        slots: [
          { key: "agility", label: "Agility", group: "Agility / Strength" },
          { key: "strength", label: "Strength", group: "Agility / Strength" },
          { key: "finesse", label: "Finesse", group: "Finesse / Instinct" },
          { key: "instinct", label: "Instinct", group: "Finesse / Instinct" },
          { key: "presence", label: "Presence", group: "Presence / Knowledge" },
          { key: "knowledge", label: "Knowledge", group: "Presence / Knowledge" },
        ],
        standardArray: [2, 1, 1, 0, 0, -1],
      },
    },
    experiences_pick: {
      enabled: true,
      label: "Create Your Experiences",
      subtitle: "Two short phrases that capture who your hero has been.",
      shortLabel: "Experiences",
      component: "experience_input",
      config: {
        count: 2,
        modifier: 2,
        suggestions: [
          { label: "Backgrounds", items: ["Assassin", "Blacksmith"] },
          { label: "Skills", items: ["Tracker", "Liar"] },
        ],
      },
    },
    domain_cards_pick: {
      enabled: true,
      label: "Choose Your Domain Cards",
      subtitle: "Pick two starting cards from your class's domains.",
      shortLabel: "Cards",
      component: "card_picker",
      dataSource: {
        table: "compendium_abilities",
        filter: { ability_type: "domain_card", level: 1 },
        dependsOn: "class_pick",
        dependColumn: "classes",
        dependType: "contains",
        dependValueFrom: "name",
      },
      config: { selectCount: 2 },
    },
    review: {
      enabled: true,
      label: "Behold",
      shortLabel: "Behold",
      component: "review_summary",
    },
  },
  phases: [
    {
      label: "Build",
      steps: [
        "class_pick",
        "subclass_pick",
        "ancestry_pick",
        "community_pick",
        "weapon_primary_pick",
        "weapon_secondary_pick",
        "armor_pick",
        "potion_pick",
        "class_item_pick",
        "traits",
        "experiences_pick",
        "domain_cards_pick",
        "review",
      ],
    },
  ],
  classThemes: {
    Warrior: {
      gradient: "from-red-700 to-red-900",
      borderColor: "border-red-500",
      textColor: "text-red-100",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      icon: (() => null) as any,
      domains: ["Blade", "Bone"],
    },
  },
};

function renderWizard(open = true) {
  return render(
    <CharacterCreationWizard
      open={open}
      onClose={vi.fn()}
      campaignId="campaign-1"
      systemId="system-1"
      systemSlug="daggerheart"
      userId="user-1"
      wizardConfig={wizardConfig}
    />
  );
}

describe("CharacterCreationWizard", () => {
  it("renders nothing when open is false", () => {
    const { container } = renderWizard(false);
    expect(container.firstChild).toBeNull();
  });

  it("renders the step progress bar with the configured labels", () => {
    renderWizard();
    expect(screen.getByText("Class")).toBeInTheDocument();
    expect(screen.getByText("Subclass")).toBeInTheDocument();
    expect(screen.getByText("Behold")).toBeInTheDocument();
  });

  it("renders the class step heading + subtitle in dark leather", () => {
    renderWizard();
    expect(screen.getByText(/choose your class/i)).toBeInTheDocument();
    expect(screen.getByText(/a defining path/i)).toBeInTheDocument();
  });

  it("renders one button per class in the left page", () => {
    renderWizard();
    expect(screen.getByLabelText(/choose warrior/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/choose wizard/i)).toBeInTheDocument();
  });

  it("starts with no class selected and the right page prompting the player", () => {
    renderWizard();
    expect(screen.getByText(/pick a class to see its details/i)).toBeInTheDocument();
  });

  it("renders the selected class details on the right page after click", async () => {
    const user = userEvent.setup();
    renderWizard();
    await user.click(screen.getByLabelText(/choose warrior/i));
    expect(screen.getAllByText("Warrior").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/disciplined fighters/i)).toBeInTheDocument();
    expect(screen.getByText("HP Slots")).toBeInTheDocument();
    expect(screen.getAllByText("Evasion").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Hit Die")).toBeInTheDocument();
    expect(screen.getAllByText("Blade").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Bone").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Hope Feature").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Class Feature").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("No Mercy").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Attack of Opportunity").length).toBeGreaterThanOrEqual(1);
  });

  it("Continue is disabled until a class is selected", async () => {
    const user = userEvent.setup();
    renderWizard();
    const cont = screen.getByRole("button", { name: /continue/i });
    expect(cont).toBeDisabled();
    await user.click(screen.getByLabelText(/choose warrior/i));
    expect(cont).not.toBeDisabled();
  });

  it("Previous is disabled on the first step", () => {
    renderWizard();
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
  });

  it("clicking Continue advances to the next step", async () => {
    const user = userEvent.setup();
    renderWizard();
    await user.click(screen.getByLabelText(/choose warrior/i));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByText("Step 2 of 13")).toBeInTheDocument();
  });
});

// ─── Helpers ────────────────────────────────────────────────

async function advanceToSubclassStep(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByLabelText(/choose warrior/i));
  await user.click(screen.getByRole("button", { name: /continue/i }));
}

async function advanceToAncestryStep(user: ReturnType<typeof userEvent.setup>) {
  await advanceToSubclassStep(user);
  await user.click(screen.getByLabelText(/choose call of the brave/i));
  await user.click(screen.getByRole("button", { name: /continue/i }));
}

async function advanceToCommunityStep(user: ReturnType<typeof userEvent.setup>) {
  await advanceToAncestryStep(user);
  await user.click(screen.getByLabelText(/choose faerie/i));
  await user.click(screen.getByRole("button", { name: /continue/i }));
}

async function advanceToPrimaryWeaponStep(user: ReturnType<typeof userEvent.setup>) {
  await advanceToCommunityStep(user);
  await user.click(screen.getByLabelText(/choose highborne/i));
  await user.click(screen.getByRole("button", { name: /continue/i }));
}

async function advanceToSecondaryWeaponStep(
  user: ReturnType<typeof userEvent.setup>
) {
  await advanceToPrimaryWeaponStep(user);
  // Broadsword is one-handed, so the secondary step stays visible.
  await user.click(screen.getByLabelText(/choose broadsword/i));
  await user.click(screen.getByRole("button", { name: /continue/i }));
}

async function advanceToArmorStep(user: ReturnType<typeof userEvent.setup>) {
  await advanceToSecondaryWeaponStep(user);
  await user.click(screen.getByLabelText(/choose round shield/i));
  await user.click(screen.getByRole("button", { name: /continue/i }));
}

async function advanceToPotionStep(user: ReturnType<typeof userEvent.setup>) {
  await advanceToArmorStep(user);
  await user.click(screen.getByLabelText(/choose gambeson armor/i));
  await user.click(screen.getByRole("button", { name: /continue/i }));
}

async function advanceToClassItemStep(user: ReturnType<typeof userEvent.setup>) {
  await advanceToPotionStep(user);
  await user.click(screen.getByLabelText(/choose minor health potion/i));
  await user.click(screen.getByRole("button", { name: /continue/i }));
}

async function advanceToTraitsStep(user: ReturnType<typeof userEvent.setup>) {
  await advanceToClassItemStep(user);
  // Warrior's first class item per DAGGERHEART_CLASS_ITEMS.
  await user.click(screen.getByLabelText(/choose the drawing of a lover/i));
  await user.click(screen.getByRole("button", { name: /continue/i }));
}

/**
 * Assigns the SRD standard array (+2, +1, +1, +0, +0, -1) across the six trait
 * dropdowns in order. The component pool de-duplicates as values are picked, so
 * we walk the slot order and pick the first matching available option.
 */
async function fillAllTraits(user: ReturnType<typeof userEvent.setup>) {
  const slotKeys = [
    "agility",
    "strength",
    "finesse",
    "instinct",
    "presence",
    "knowledge",
  ];
  const values = ["2", "1", "1", "0", "0", "-1"];
  for (let i = 0; i < slotKeys.length; i++) {
    const dropdown = screen.getByLabelText(
      new RegExp(`Assign value to ${slotKeys[i]}`, "i")
    );
    await user.selectOptions(dropdown, values[i]);
  }
}

async function advanceToExperiencesStep(user: ReturnType<typeof userEvent.setup>) {
  await advanceToTraitsStep(user);
  await fillAllTraits(user);
  await user.click(screen.getByRole("button", { name: /continue/i }));
}

async function advanceToDomainCardsStep(
  user: ReturnType<typeof userEvent.setup>
) {
  await advanceToExperiencesStep(user);
  await user.type(screen.getByLabelText(/experience 1/i), "World Traveler");
  await user.type(screen.getByLabelText(/experience 2/i), "Field Medic");
  await user.click(screen.getByRole("button", { name: /continue/i }));
}

async function advanceToReviewStep(user: ReturnType<typeof userEvent.setup>) {
  await advanceToDomainCardsStep(user);
  await user.click(screen.getByLabelText(/view reckless slash/i));
  await user.click(screen.getByRole("button", { name: /add to loadout/i }));
  await user.click(screen.getByLabelText(/view bone sense/i));
  await user.click(screen.getByRole("button", { name: /add to loadout/i }));
  await user.click(screen.getByRole("button", { name: /continue/i }));
}

describe("CharacterCreationWizard — subclass step", () => {
  it("shows the subclass step heading + subtitle after advancing from class", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToSubclassStep(user);
    expect(screen.getByText(/choose a subclass/i)).toBeInTheDocument();
    expect(screen.getByText(/pick a path/i)).toBeInTheDocument();
  });

  it("only lists subclasses for the picked parent class", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToSubclassStep(user);
    expect(screen.getByLabelText(/choose call of the brave/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/choose call of the slayer/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/choose school of knowledge/i)).not.toBeInTheDocument();
  });

  it("starts with no subclass selected and the right page prompting the player", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToSubclassStep(user);
    expect(screen.getByText(/pick a subclass to see its details/i)).toBeInTheDocument();
  });

  it("Continue is disabled until a subclass is selected", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToSubclassStep(user);
    const cont = screen.getByRole("button", { name: /continue/i });
    expect(cont).toBeDisabled();
    await user.click(screen.getByLabelText(/choose call of the brave/i));
    expect(cont).not.toBeDisabled();
  });

  it("shows foundation + specialization + mastery feature buckets on the right", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToSubclassStep(user);
    await user.click(screen.getByLabelText(/choose call of the brave/i));
    expect(screen.getByText("Foundation Feature")).toBeInTheDocument();
    expect(screen.getByText("Specialization Features")).toBeInTheDocument();
    expect(screen.getByText("Mastery Features")).toBeInTheDocument();
    // Foundation features render in the detail panel and the sheet preview, so
    // expect at least one occurrence rather than exactly one.
    expect(screen.getAllByText("Battle-Hardened").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Rallying Cry")).toBeInTheDocument();
    expect(screen.getByText("Unbreakable")).toBeInTheDocument();
  });

  it("does not bleed another subclass's features into the detail", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToSubclassStep(user);
    await user.click(screen.getByLabelText(/choose call of the brave/i));
    expect(screen.queryByText("Killer Instinct")).not.toBeInTheDocument();
  });

  it("Continue advances from subclass to ancestry", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToSubclassStep(user);
    await user.click(screen.getByLabelText(/choose call of the brave/i));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByText(/choose your ancestry/i)).toBeInTheDocument();
  });
});

describe("CharacterCreationWizard — ancestry step", () => {
  it("shows the ancestry step heading + subtitle after advancing through subclass", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToAncestryStep(user);
    expect(screen.getByText(/choose your ancestry/i)).toBeInTheDocument();
    expect(screen.getByText(/your lineage/i)).toBeInTheDocument();
  });

  it("renders one button per distinct ancestry", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToAncestryStep(user);
    expect(screen.getByLabelText(/choose faerie/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/choose clank/i)).toBeInTheDocument();
  });

  it("renders a female/male variant radiogroup with male selected by default", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToAncestryStep(user);
    const group = screen.getByRole("radiogroup", { name: /portrait variant/i });
    expect(group).toBeInTheDocument();
    const female = screen.getByRole("radio", { name: /^female$/i });
    const male = screen.getByRole("radio", { name: /^male$/i });
    expect(male).toHaveAttribute("aria-checked", "true");
    expect(female).toHaveAttribute("aria-checked", "false");
  });

  it("flips the variant when Female is clicked", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToAncestryStep(user);
    await user.click(screen.getByRole("radio", { name: /^female$/i }));
    expect(screen.getByRole("radio", { name: /^female$/i })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.getByRole("radio", { name: /^male$/i })).toHaveAttribute(
      "aria-checked",
      "false"
    );
  });

  it("renders portrait thumbnails for ancestries with art", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToAncestryStep(user);
    // Faerie has female + male art; default variant is male.
    const faerieBtn = screen.getByLabelText(/choose faerie/i);
    const img = faerieBtn.querySelector("img");
    expect(img).toBeTruthy();
    expect(img?.getAttribute("src")).toMatch(/Faerie/i);
  });

  it("Continue is disabled until an ancestry is selected", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToAncestryStep(user);
    const cont = screen.getByRole("button", { name: /continue/i });
    expect(cont).toBeDisabled();
    await user.click(screen.getByLabelText(/choose faerie/i));
    expect(cont).not.toBeDisabled();
  });

  it("shows the ancestry description and both features in the detail panel on selection", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToAncestryStep(user);
    await user.click(screen.getByLabelText(/choose faerie/i));
    expect(screen.getByText(/tiny winged beings of mischief/i)).toBeInTheDocument();
    // Ancestry features also surface in the sheet preview, so expect ≥ 1.
    expect(screen.getAllByText("Luckbringer").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Wings").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/re-roll a hope die/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/fly short distances/i).length).toBeGreaterThanOrEqual(1);
  });

  it("shows the ancestry portrait beside the description in the detail panel", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToAncestryStep(user);
    await user.click(screen.getByLabelText(/choose faerie/i));
    const detail = screen.getByTestId("ancestry-detail");
    const img = detail.querySelector("img");
    expect(img).toBeTruthy();
    expect(img?.getAttribute("src")).toMatch(/Faerie/i);
  });

  it("Continue advances from ancestry to community", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToAncestryStep(user);
    await user.click(screen.getByLabelText(/choose faerie/i));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByText(/choose your community/i)).toBeInTheDocument();
  });
});

describe("CharacterCreationWizard — community step", () => {
  it("shows the community step heading + subtitle", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToCommunityStep(user);
    expect(screen.getByText(/choose your community/i)).toBeInTheDocument();
    expect(screen.getByText(/your upbringing/i)).toBeInTheDocument();
  });

  it("renders one button per distinct community", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToCommunityStep(user);
    expect(screen.getByLabelText(/choose highborne/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/choose wanderborne/i)).toBeInTheDocument();
  });

  it("Continue is disabled until a community is selected", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToCommunityStep(user);
    const cont = screen.getByRole("button", { name: /continue/i });
    expect(cont).toBeDisabled();
    await user.click(screen.getByLabelText(/choose highborne/i));
    expect(cont).not.toBeDisabled();
  });

  it("shows the chosen community's description + feature on the right", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToCommunityStep(user);
    await user.click(screen.getByLabelText(/choose highborne/i));
    expect(screen.getByText(/born to wealth and influence/i)).toBeInTheDocument();
    // Community feature also surfaces in the sheet preview, so expect ≥ 1.
    expect(screen.getAllByText("Privilege").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/\+1 to presence rolls/i).length).toBeGreaterThanOrEqual(1);
  });

  it("Continue advances past community to the Primary Weapon step", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToCommunityStep(user);
    await user.click(screen.getByLabelText(/choose highborne/i));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByText("Step 5 of 13")).toBeInTheDocument();
    expect(screen.getByText(/choose your primary weapon/i)).toBeInTheDocument();
  });
});

describe("CharacterCreationWizard — traits step", () => {
  it("shows heading + subtitle after advancing through community", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToTraitsStep(user);
    expect(screen.getByText(/assign traits/i)).toBeInTheDocument();
    expect(screen.getByText(/distribute the standard array/i)).toBeInTheDocument();
  });

  it("renders one dropdown per trait slot, all starting empty", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToTraitsStep(user);
    for (const key of [
      "agility",
      "strength",
      "finesse",
      "instinct",
      "presence",
      "knowledge",
    ]) {
      const dropdown = screen.getByLabelText(
        new RegExp(`Assign value to ${key}`, "i")
      );
      expect(dropdown).toBeInTheDocument();
      expect(dropdown).toHaveValue("");
    }
  });

  it("Continue is disabled until all six traits are assigned", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToTraitsStep(user);
    const cont = screen.getByRole("button", { name: /continue/i });
    expect(cont).toBeDisabled();
    // Assign only five — should still be disabled.
    const slotKeys = ["agility", "strength", "finesse", "instinct", "presence"];
    const values = ["2", "1", "1", "0", "0"];
    for (let i = 0; i < slotKeys.length; i++) {
      const dropdown = screen.getByLabelText(
        new RegExp(`Assign value to ${slotKeys[i]}`, "i")
      );
      await user.selectOptions(dropdown, values[i]);
    }
    expect(cont).toBeDisabled();
    // Assign the last one — enabled.
    await user.selectOptions(
      screen.getByLabelText(/Assign value to knowledge/i),
      "-1"
    );
    expect(cont).not.toBeDisabled();
  });

  it("does not offer a duplicate +2 once one trait already took it", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToTraitsStep(user);
    await user.selectOptions(
      screen.getByLabelText(/Assign value to agility/i),
      "2"
    );
    // +2 should now be gone from every OTHER trait's option list.
    const strength = screen.getByLabelText(/Assign value to strength/i) as HTMLSelectElement;
    const strengthOptions = Array.from(strength.options).map((o) => o.value);
    expect(strengthOptions).not.toContain("2");
    // The +1 (which has two copies) should still be available.
    expect(strengthOptions).toContain("1");
  });

  it("renders the SRD trait descriptions on the right page", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToTraitsStep(user);
    // The reference panel shows the SRD action verbs for each trait.
    expect(screen.getByText(/sprint, leap, maneuver/i)).toBeInTheDocument();
    expect(screen.getByText(/lift, smash, grapple/i)).toBeInTheDocument();
    expect(screen.getByText(/recall, analyze, comprehend/i)).toBeInTheDocument();
  });

  it("Continue advances from traits to the Experiences step", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToTraitsStep(user);
    await fillAllTraits(user);
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByText(/create your experiences/i)).toBeInTheDocument();
  });
});

describe("CharacterCreationWizard — experiences step", () => {
  it("shows heading + subtitle after advancing through traits", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToExperiencesStep(user);
    expect(screen.getByText(/create your experiences/i)).toBeInTheDocument();
    expect(screen.getByText(/two short phrases/i)).toBeInTheDocument();
  });

  it("renders two text inputs labeled Experience 1 / Experience 2", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToExperiencesStep(user);
    expect(screen.getByLabelText(/experience 1/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/experience 2/i)).toBeInTheDocument();
  });

  it("renders the modifier badge (+2) next to each input", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToExperiencesStep(user);
    expect(screen.getAllByText("+2").length).toBeGreaterThanOrEqual(2);
  });

  it("Continue is disabled until both experiences have non-empty names", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToExperiencesStep(user);
    const cont = screen.getByRole("button", { name: /continue/i });
    expect(cont).toBeDisabled();
    await user.type(screen.getByLabelText(/experience 1/i), "World Traveler");
    expect(cont).toBeDisabled();
    await user.type(screen.getByLabelText(/experience 2/i), "Field Medic");
    expect(cont).not.toBeDisabled();
  });

  it("renders suggestion chip groups on the right page", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToExperiencesStep(user);
    expect(screen.getByText("Backgrounds")).toBeInTheDocument();
    expect(screen.getByText("Skills")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Assassin" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tracker" })).toBeInTheDocument();
  });

  it("clicking a suggestion chip drops its text into the focused input", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToExperiencesStep(user);
    const exp2 = screen.getByLabelText(/experience 2/i) as HTMLInputElement;
    await user.click(exp2);
    await user.click(screen.getByRole("button", { name: "Assassin" }));
    expect(exp2).toHaveValue("Assassin");
  });

  it("without a focused input, clicking a chip fills the first empty input", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToExperiencesStep(user);
    const exp1 = screen.getByLabelText(/experience 1/i) as HTMLInputElement;
    await user.click(screen.getByRole("button", { name: "Tracker" }));
    expect(exp1).toHaveValue("Tracker");
  });
});

describe("CharacterCreationWizard — primary weapon step", () => {
  it("shows the primary weapon heading + subtitle", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToPrimaryWeaponStep(user);
    expect(screen.getByText(/choose your primary weapon/i)).toBeInTheDocument();
  });

  it("lists tier-1 primary weapons only (no tier-2, no secondaries)", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToPrimaryWeaponStep(user);
    expect(screen.getByLabelText(/choose broadsword/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/choose battleaxe/i)).toBeInTheDocument();
    // Tier 2 weapon hidden
    expect(screen.queryByLabelText(/choose greataxe/i)).not.toBeInTheDocument();
    // Secondary-category weapon hidden
    expect(screen.queryByLabelText(/choose round shield/i)).not.toBeInTheDocument();
  });

  it("groups the primary weapon list by hands (One-Handed / Two-Handed)", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToPrimaryWeaponStep(user);
    expect(screen.getByText("One-Handed")).toBeInTheDocument();
    expect(screen.getByText("Two-Handed")).toBeInTheDocument();
    // Broadsword sits inside the One-Handed group; Battleaxe inside Two-Handed.
    const oneHandedHeader = screen.getByText("One-Handed");
    const twoHandedHeader = screen.getByText("Two-Handed");
    const broadsword = screen.getByLabelText(/choose broadsword/i);
    const battleaxe = screen.getByLabelText(/choose battleaxe/i);
    // Each weapon button is a descendant of the group that owns its header —
    // walk up looking for the header text inside the same group container.
    function inSameGroupAs(button: HTMLElement, header: HTMLElement) {
      let node: HTMLElement | null = button.parentElement;
      while (node) {
        if (node.contains(header)) return true;
        node = node.parentElement;
      }
      return false;
    }
    expect(inSameGroupAs(broadsword, oneHandedHeader)).toBe(true);
    expect(inSameGroupAs(battleaxe, twoHandedHeader)).toBe(true);
  });

  it("hides magic weapons for classes without a spellcast trait", async () => {
    // Warrior has no spellcast_trait, so the magic Hallowed Axe should not appear.
    const user = userEvent.setup();
    renderWizard();
    await advanceToPrimaryWeaponStep(user);
    expect(screen.queryByLabelText(/choose hallowed axe/i)).not.toBeInTheDocument();
  });

  it("Continue is disabled until a primary weapon is selected", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToPrimaryWeaponStep(user);
    const cont = screen.getByRole("button", { name: /continue/i });
    expect(cont).toBeDisabled();
    await user.click(screen.getByLabelText(/choose broadsword/i));
    expect(cont).not.toBeDisabled();
  });

  it("shows damage / range / trait / hands + feature on the right detail panel", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToPrimaryWeaponStep(user);
    await user.click(screen.getByLabelText(/choose broadsword/i));
    expect(screen.getByText("Damage")).toBeInTheDocument();
    expect(screen.getAllByText(/d8\+1 phy/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Range")).toBeInTheDocument();
    expect(screen.getByText("Trait")).toBeInTheDocument();
    expect(screen.getByText("Hands")).toBeInTheDocument();
    expect(screen.getByText(/reliable: \+1 to attack/i)).toBeInTheDocument();
  });

  it("two-handed primary skips the secondary step (next continue lands on armor)", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToPrimaryWeaponStep(user);
    await user.click(screen.getByLabelText(/choose battleaxe/i));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    // Step count drops by one (12 instead of 13) and the heading is Armor.
    expect(screen.getByText("Step 6 of 12")).toBeInTheDocument();
    expect(screen.getByText(/choose your armor/i)).toBeInTheDocument();
  });

  it("one-handed primary keeps the secondary step in the flow", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToPrimaryWeaponStep(user);
    await user.click(screen.getByLabelText(/choose broadsword/i));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByText("Step 6 of 13")).toBeInTheDocument();
    expect(screen.getByText(/choose your secondary weapon/i)).toBeInTheDocument();
  });
});

describe("CharacterCreationWizard — secondary weapon step", () => {
  it("lists tier-1 secondary weapons only", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToSecondaryWeaponStep(user);
    expect(screen.getByLabelText(/choose round shield/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/choose broadsword/i)).not.toBeInTheDocument();
  });

  it("Continue is disabled until a secondary weapon is selected", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToSecondaryWeaponStep(user);
    const cont = screen.getByRole("button", { name: /continue/i });
    expect(cont).toBeDisabled();
    await user.click(screen.getByLabelText(/choose round shield/i));
    expect(cont).not.toBeDisabled();
  });
});

describe("CharacterCreationWizard — armor step", () => {
  it("lists tier-1 armor only", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToArmorStep(user);
    expect(screen.getByLabelText(/choose gambeson armor/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/choose leather armor/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/choose plate armor/i)).not.toBeInTheDocument();
  });

  it("shows base score / thresholds / feature on the right detail panel", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToArmorStep(user);
    await user.click(screen.getByLabelText(/choose gambeson armor/i));
    expect(screen.getByText("Base Score")).toBeInTheDocument();
    expect(screen.getByText("Thresholds")).toBeInTheDocument();
    expect(screen.getByText(/flexible: \+1 to evasion/i)).toBeInTheDocument();
  });

  it("Continue is disabled until armor is selected", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToArmorStep(user);
    const cont = screen.getByRole("button", { name: /continue/i });
    expect(cont).toBeDisabled();
    await user.click(screen.getByLabelText(/choose gambeson armor/i));
    expect(cont).not.toBeDisabled();
  });
});

describe("CharacterCreationWizard — potion step", () => {
  it("lists only the two SRD starting potions", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToPotionStep(user);
    expect(screen.getByLabelText(/choose minor health potion/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/choose minor stamina potion/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/choose elixir of hope/i)).not.toBeInTheDocument();
  });

  it("Continue is disabled until a potion is selected", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToPotionStep(user);
    const cont = screen.getByRole("button", { name: /continue/i });
    expect(cont).toBeDisabled();
    await user.click(screen.getByLabelText(/choose minor health potion/i));
    expect(cont).not.toBeDisabled();
  });
});

describe("CharacterCreationWizard — class item step", () => {
  it("lists the two class-specific items for the picked class", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToClassItemStep(user);
    // Warrior options per DAGGERHEART_CLASS_ITEMS.
    expect(screen.getByLabelText(/choose the drawing of a lover/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/choose a sharpening stone/i)).toBeInTheDocument();
  });

  it("Continue is disabled until a class item is selected", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToClassItemStep(user);
    const cont = screen.getByRole("button", { name: /continue/i });
    expect(cont).toBeDisabled();
    await user.click(screen.getByLabelText(/choose the drawing of a lover/i));
    expect(cont).not.toBeDisabled();
  });
});

describe("CharacterCreationWizard — domain cards step", () => {
  it("shows the heading + selection counter (0 of 2 chosen) on entry", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToDomainCardsStep(user);
    expect(screen.getByText(/choose your domain cards/i)).toBeInTheDocument();
    expect(screen.getByText(/0 of 2 chosen/i)).toBeInTheDocument();
  });

  it("lists only domain cards from the picked class's domains", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToDomainCardsStep(user);
    // All four mock cards include Warrior in their classes[] so they all show.
    expect(screen.getByLabelText(/view reckless slash/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/view get back up/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/view bone sense/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/view whirling strike/i)).toBeInTheDocument();
  });

  it("clicking a card focuses it in the right detail panel", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToDomainCardsStep(user);
    await user.click(screen.getByLabelText(/view reckless slash/i));
    expect(
      screen.getByText(/make an attack with advantage/i)
    ).toBeInTheDocument();
    // Add button is available when the card isn't yet in the loadout.
    expect(
      screen.getByRole("button", { name: /add to loadout/i })
    ).toBeInTheDocument();
  });

  it("Add adds the focused card to the loadout and flips the button to Remove", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToDomainCardsStep(user);
    await user.click(screen.getByLabelText(/view reckless slash/i));
    await user.click(screen.getByRole("button", { name: /add to loadout/i }));
    expect(screen.getByText(/1 of 2 chosen/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /remove from loadout/i })
    ).toBeInTheDocument();
  });

  it("Remove takes the card back out of the loadout", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToDomainCardsStep(user);
    await user.click(screen.getByLabelText(/view reckless slash/i));
    await user.click(screen.getByRole("button", { name: /add to loadout/i }));
    await user.click(screen.getByRole("button", { name: /remove from loadout/i }));
    expect(screen.getByText(/0 of 2 chosen/i)).toBeInTheDocument();
  });

  it("Continue is disabled until exactly two cards are picked", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToDomainCardsStep(user);
    const cont = screen.getByRole("button", { name: /continue/i });
    expect(cont).toBeDisabled();

    await user.click(screen.getByLabelText(/view reckless slash/i));
    await user.click(screen.getByRole("button", { name: /add to loadout/i }));
    expect(cont).toBeDisabled();

    await user.click(screen.getByLabelText(/view bone sense/i));
    await user.click(screen.getByRole("button", { name: /add to loadout/i }));
    expect(cont).not.toBeDisabled();
  });

  it("disables the Add button once two cards are already chosen", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToDomainCardsStep(user);
    // Pick two cards
    await user.click(screen.getByLabelText(/view reckless slash/i));
    await user.click(screen.getByRole("button", { name: /add to loadout/i }));
    await user.click(screen.getByLabelText(/view bone sense/i));
    await user.click(screen.getByRole("button", { name: /add to loadout/i }));
    // Focus a third card — its Add button should be disabled.
    await user.click(screen.getByLabelText(/view whirling strike/i));
    expect(
      screen.getByRole("button", { name: /add to loadout/i })
    ).toBeDisabled();
  });
});

describe("CharacterCreationWizard — review step", () => {
  it("shows the Final Checks panel with one row per build phase", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToReviewStep(user);
    expect(screen.getByText(/final checks/i)).toBeInTheDocument();
    // Heritage + Equipment are unique to Final Checks (no progress-bar
    // collision); Class / Traits / Experiences / Cards also appear in the
    // progress bar so a getAll with length>=1 is enough.
    expect(screen.getByText("Heritage")).toBeInTheDocument();
    expect(screen.getByText("Equipment")).toBeInTheDocument();
    for (const label of ["Class", "Traits", "Experiences", "Cards"]) {
      expect(screen.getAllByText(label).length).toBeGreaterThanOrEqual(1);
    }
    // The picks are summarized — Warrior + Brave for class, Faerie + Highborne
    // for heritage, the traits modifier string, etc.
    expect(screen.getByText(/Warrior · Call of the Brave/i)).toBeInTheDocument();
    expect(screen.getByText(/Faerie · Highborne/i)).toBeInTheDocument();
    expect(screen.getByText(/World Traveler · Field Medic/i)).toBeInTheDocument();
    expect(screen.getByText(/2 of 2 picked/i)).toBeInTheDocument();
  });

  it("renders the Begin Your Adventure flavor panel on the right page", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToReviewStep(user);
    expect(screen.getByText(/begin your adventure/i)).toBeInTheDocument();
  });

  it("transforms the footer Continue button into Start Your Adventure on review", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToReviewStep(user);
    expect(
      screen.getByRole("button", { name: /start your adventure/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^continue$/i })
    ).not.toBeInTheDocument();
  });

  it("Start Your Adventure is disabled until the hero has a name", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToReviewStep(user);
    const start = screen.getByRole("button", { name: /start your adventure/i });
    expect(start).toBeDisabled();
    // Type a name into the sheet preview banner input.
    await user.type(screen.getByLabelText(/character name/i), "Kael Ashgrin");
    expect(start).not.toBeDisabled();
  });

  it("clicking Start saves the character and routes to the characters page", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToReviewStep(user);
    await user.type(screen.getByLabelText(/character name/i), "Kael Ashgrin");
    await user.click(
      screen.getByRole("button", { name: /start your adventure/i })
    );
    expect(mockSaveNewCharacter).toHaveBeenCalledTimes(1);
    const params = mockSaveNewCharacter.mock.calls[0][0] as {
      campaignId: string;
      wizardState: { name: string; className: string | null };
    };
    expect(params.campaignId).toBe("campaign-1");
    expect(params.wizardState.name).toBe("Kael Ashgrin");
    expect(params.wizardState.className).toBe("Warrior");
    expect(mockToastSuccess).toHaveBeenCalledWith("Character created");
    expect(mockPush).toHaveBeenCalledWith(
      "/campaign/campaign-1/characters?selected=char-1"
    );
  });

  it("Save failure surfaces a toast error and does not navigate", async () => {
    mockSaveNewCharacter.mockImplementationOnce(async () => {
      throw new Error("DB down");
    });
    const user = userEvent.setup();
    renderWizard();
    await advanceToReviewStep(user);
    await user.type(screen.getByLabelText(/character name/i), "Kael Ashgrin");
    await user.click(
      screen.getByRole("button", { name: /start your adventure/i })
    );
    expect(mockToastError).toHaveBeenCalledWith(
      "Failed to create character",
      { description: "DB down" }
    );
    expect(mockPush).not.toHaveBeenCalled();
  });
});
