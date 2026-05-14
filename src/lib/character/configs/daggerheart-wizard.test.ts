import { describe, it, expect } from "vitest";
import {
  DAGGERHEART_WIZARD_CONFIG,
  DAGGERHEART_CLASS_THEMES,
  DAGGERHEART_TRAIT_SLOTS,
  DAGGERHEART_STANDARD_ARRAY,
  DAGGERHEART_CLASS_ITEMS,
  DAGGERHEART_BASIC_SUPPLY_NAMES,
  DAGGERHEART_EXPERIENCE_SUGGESTIONS,
} from "./daggerheart-wizard";

describe("Daggerheart Wizard Config", () => {
  it("has 9 class themes", () => {
    expect(Object.keys(DAGGERHEART_CLASS_THEMES)).toHaveLength(9);
  });

  it("all class themes have required fields", () => {
    for (const [name, theme] of Object.entries(DAGGERHEART_CLASS_THEMES)) {
      expect(theme.gradient, `${name} missing gradient`).toBeTruthy();
      expect(theme.borderColor, `${name} missing borderColor`).toBeTruthy();
      expect(theme.textColor, `${name} missing textColor`).toBeTruthy();
      expect(theme.icon, `${name} missing icon`).toBeTruthy();
      expect(theme.domains, `${name} missing domains`).toHaveLength(2);
    }
  });

  it("has 6 trait slots in 3 pairs", () => {
    expect(DAGGERHEART_TRAIT_SLOTS).toHaveLength(6);
    const groups = new Set(DAGGERHEART_TRAIT_SLOTS.map((s) => s.group));
    expect(groups.size).toBe(3);
  });

  it("standard array matches the SRD (+2, +1, +1, +0, +0, -1)", () => {
    // Daggerheart SRD 9-09-25 step 3 (page 4): "Assign the modifiers +2, +1, +1, +0, +0, -1
    // to your character's traits in any order you wish."
    expect([...DAGGERHEART_STANDARD_ARRAY].sort()).toEqual([-1, 0, 0, 1, 1, 2]);
    expect(DAGGERHEART_STANDARD_ARRAY.reduce((a, b) => a + b, 0)).toBe(3);
  });

  it("trait step config does not declare a markCount (no marking mechanic in the SRD)", () => {
    const traits = DAGGERHEART_WIZARD_CONFIG.steps.traits;
    expect(traits.config).toBeDefined();
    expect(traits.config).not.toHaveProperty("markCount");
  });

  it("has 7 phases (Name input moved onto the review/Behold screen, dropping the standalone Name phase)", () => {
    // Class, Heritage, Equipment, Traits, Experiences, Cards, Create
    expect(DAGGERHEART_WIZARD_CONFIG.phases).toHaveLength(7);
  });

  it("all phase steps reference defined step configs", () => {
    for (const phase of DAGGERHEART_WIZARD_CONFIG.phases) {
      for (const stepKey of phase.steps) {
        expect(
          DAGGERHEART_WIZARD_CONFIG.steps[stepKey],
          `Step "${stepKey}" in phase "${phase.label}" not found in steps config`
        ).toBeDefined();
      }
    }
  });

  it("all steps are enabled by default", () => {
    for (const [key, step] of Object.entries(DAGGERHEART_WIZARD_CONFIG.steps)) {
      expect(step.enabled, `Step "${key}" should be enabled`).toBe(true);
    }
  });

  it("class_pick has data source pointing to compendium_classes", () => {
    const step = DAGGERHEART_WIZARD_CONFIG.steps.class_pick;
    expect(step.dataSource?.table).toBe("compendium_classes");
    expect(step.dataSource?.filter).toEqual({ is_subclass: false });
  });

  it("subclass_pick depends on class_pick", () => {
    const step = DAGGERHEART_WIZARD_CONFIG.steps.subclass_pick;
    expect(step.dataSource?.dependsOn).toBe("class_pick");
    expect(step.dataSource?.dependColumn).toBe("parent_class_id");
  });

  // ─── Heritage steps (ancestry + community) ─────────────────

  it("Heritage phase contains ancestry_pick then community_pick", () => {
    const heritage = DAGGERHEART_WIZARD_CONFIG.phases.find((p) => p.label === "Heritage");
    expect(heritage).toBeDefined();
    expect(heritage?.steps).toEqual(["ancestry_pick", "community_pick"]);
  });

  it("does not define the legacy free-text 'ancestry' step", () => {
    expect(DAGGERHEART_WIZARD_CONFIG.steps.ancestry).toBeUndefined();
  });

  it("ancestry_pick is a card_picker fetching ancestry_feature rows", () => {
    const step = DAGGERHEART_WIZARD_CONFIG.steps.ancestry_pick;
    expect(step).toBeDefined();
    expect(step.component).toBe("card_picker");
    expect(step.dataSource?.table).toBe("compendium_abilities");
    expect(step.dataSource?.filter).toEqual({ ability_type: "ancestry_feature" });
    // No dependency — all ancestries are visible from the start
    expect(step.dataSource?.dependsOn).toBeUndefined();
  });

  it("community_pick is a card_picker fetching community_feature rows", () => {
    const step = DAGGERHEART_WIZARD_CONFIG.steps.community_pick;
    expect(step).toBeDefined();
    expect(step.component).toBe("card_picker");
    expect(step.dataSource?.table).toBe("compendium_abilities");
    expect(step.dataSource?.filter).toEqual({ ability_type: "community_feature" });
    expect(step.dataSource?.dependsOn).toBeUndefined();
  });

  // ─── Equipment steps (weapons + armor + potion + class item) ──

  it("Equipment phase sits between Heritage and Traits with 5 ordered steps", () => {
    const phases = DAGGERHEART_WIZARD_CONFIG.phases;
    const heritageIdx = phases.findIndex((p) => p.label === "Heritage");
    const equipmentIdx = phases.findIndex((p) => p.label === "Equipment");
    const traitsIdx = phases.findIndex((p) => p.label === "Traits");

    expect(heritageIdx).toBeGreaterThanOrEqual(0);
    expect(equipmentIdx).toBe(heritageIdx + 1);
    expect(traitsIdx).toBe(equipmentIdx + 1);

    expect(phases[equipmentIdx].steps).toEqual([
      "weapon_primary_pick",
      "weapon_secondary_pick",
      "armor_pick",
      "potion_pick",
      "class_item_pick",
    ]);
  });

  it("weapon_primary_pick is a card_picker filtering Tier 1 Primary weapons", () => {
    const step = DAGGERHEART_WIZARD_CONFIG.steps.weapon_primary_pick;
    expect(step).toBeDefined();
    expect(step.component).toBe("card_picker");
    expect(step.dataSource?.table).toBe("compendium_items");
    // Filter must scope to weapon rows; component layer narrows to Tier 1 + Primary via properties.
    expect(step.dataSource?.filter).toMatchObject({ type: "weapon" });
  });

  it("weapon_secondary_pick is a card_picker filtering Tier 1 Secondary weapons", () => {
    const step = DAGGERHEART_WIZARD_CONFIG.steps.weapon_secondary_pick;
    expect(step).toBeDefined();
    expect(step.component).toBe("card_picker");
    expect(step.dataSource?.table).toBe("compendium_items");
    expect(step.dataSource?.filter).toMatchObject({ type: "weapon" });
  });

  it("weapon_secondary_pick is hidden unless the chosen primary is One-Handed", () => {
    // The wizard skips the secondary step when the player picked a 2H primary.
    // The mechanism is a showWhen condition on a wizard-state flag.
    const step = DAGGERHEART_WIZARD_CONFIG.steps.weapon_secondary_pick;
    expect(step.showWhen).toBeDefined();
    expect(step.showWhen).toMatchObject({
      requiresState: { key: "primaryWeaponIsTwoHanded", equals: false },
    });
  });

  it("armor_pick is a card_picker filtering Tier 1 armor", () => {
    const step = DAGGERHEART_WIZARD_CONFIG.steps.armor_pick;
    expect(step).toBeDefined();
    expect(step.component).toBe("card_picker");
    expect(step.dataSource?.table).toBe("compendium_items");
    expect(step.dataSource?.filter).toMatchObject({ type: "armor" });
  });

  it("potion_pick is a card_picker fetching consumables (filtered to Minor Health + Minor Stamina in-component)", () => {
    const step = DAGGERHEART_WIZARD_CONFIG.steps.potion_pick;
    expect(step).toBeDefined();
    expect(step.component).toBe("card_picker");
    expect(step.dataSource?.table).toBe("compendium_items");
    expect(step.dataSource?.filter).toMatchObject({ type: "consumable" });
  });

  it("class_item_pick is a card_picker that depends on class_pick", () => {
    // class_item_pick doesn't hit the DB — it renders the 2 free-text options from
    // DAGGERHEART_CLASS_ITEMS for the chosen class. No dataSource required.
    const step = DAGGERHEART_WIZARD_CONFIG.steps.class_item_pick;
    expect(step).toBeDefined();
    expect(step.component).toBe("card_picker");
  });

  // ─── DAGGERHEART_CLASS_ITEMS constant ──────────────────────

  it("DAGGERHEART_CLASS_ITEMS has all 9 classes, each with exactly 2 string options", () => {
    const expectedClasses = [
      "Bard",
      "Druid",
      "Guardian",
      "Ranger",
      "Rogue",
      "Seraph",
      "Sorcerer",
      "Warrior",
      "Wizard",
    ];
    expect(Object.keys(DAGGERHEART_CLASS_ITEMS).sort()).toEqual(expectedClasses.sort());

    for (const cls of expectedClasses) {
      const items = DAGGERHEART_CLASS_ITEMS[cls];
      expect(items, `${cls} should have items`).toBeDefined();
      expect(items, `${cls} should have exactly 2 options`).toHaveLength(2);
      for (const opt of items) {
        expect(typeof opt).toBe("string");
        expect(opt.length, `${cls} option must be non-empty`).toBeGreaterThan(0);
      }
    }
  });

  it("DAGGERHEART_CLASS_ITEMS matches SRD class guide text for a sample of classes", () => {
    // Spot-check a few canonical entries against the SRD pages.
    expect(DAGGERHEART_CLASS_ITEMS.Bard).toEqual([
      "A romance novel",
      "A letter never opened",
    ]);
    expect(DAGGERHEART_CLASS_ITEMS.Warrior).toEqual([
      "The drawing of a lover",
      "A sharpening stone",
    ]);
    expect(DAGGERHEART_CLASS_ITEMS.Wizard).toEqual([
      "A book you're trying to translate",
      "A tiny, harmless elemental pet",
    ]);
  });

  // ─── DAGGERHEART_BASIC_SUPPLY_NAMES constant ───────────────

  it("DAGGERHEART_BASIC_SUPPLY_NAMES lists the 4 SRD step-5 auto-add items", () => {
    expect(DAGGERHEART_BASIC_SUPPLY_NAMES).toEqual([
      "Torch",
      "50 ft of Rope",
      "Basic Supplies",
      "Handful of Gold",
    ]);
  });

  // ─── Experiences step (SRD step 7) ─────────────────────────

  it("Experiences phase sits between Traits and Cards with a single experiences_pick step", () => {
    const phases = DAGGERHEART_WIZARD_CONFIG.phases;
    const traitsIdx = phases.findIndex((p) => p.label === "Traits");
    const experiencesIdx = phases.findIndex((p) => p.label === "Experiences");
    const createIdx = phases.findIndex((p) => p.label === "Create");

    expect(traitsIdx).toBeGreaterThanOrEqual(0);
    expect(experiencesIdx).toBe(traitsIdx + 1);
    // Cards phase sits between Experiences and Create — see the Cards phase test below.
    expect(createIdx).toBeGreaterThan(experiencesIdx);

    expect(phases[experiencesIdx].steps).toEqual(["experiences_pick"]);
  });

  it("experiences_pick is an experience_input step with count 2 and modifier 2", () => {
    const step = DAGGERHEART_WIZARD_CONFIG.steps.experiences_pick;
    expect(step).toBeDefined();
    expect(step.component).toBe("experience_input");
    expect(step.dataSource).toBeUndefined();
    expect(step.config).toMatchObject({ count: 2, modifier: 2 });
  });

  it("experiences_pick step config carries the suggestion data", () => {
    const step = DAGGERHEART_WIZARD_CONFIG.steps.experiences_pick;
    const cfg = step.config as { suggestions?: { label: string; items: string[] }[] };
    expect(cfg.suggestions).toBeDefined();
    expect(cfg.suggestions).toBe(DAGGERHEART_EXPERIENCE_SUGGESTIONS);
  });

  it("DAGGERHEART_EXPERIENCE_SUGGESTIONS has the 5 SRD example categories in order", () => {
    expect(DAGGERHEART_EXPERIENCE_SUGGESTIONS.map((s) => s.label)).toEqual([
      "Backgrounds",
      "Characteristics",
      "Specialties",
      "Skills",
      "Phrases",
    ]);
    for (const group of DAGGERHEART_EXPERIENCE_SUGGESTIONS) {
      expect(group.items.length, `${group.label} should have entries`).toBeGreaterThan(0);
    }
  });

  // ─── Domain Cards step (SRD step 8) ────────────────────────

  it("Cards phase sits between Experiences and Create with a single domain_cards_pick step", () => {
    const phases = DAGGERHEART_WIZARD_CONFIG.phases;
    const experiencesIdx = phases.findIndex((p) => p.label === "Experiences");
    const cardsIdx = phases.findIndex((p) => p.label === "Cards");
    const createIdx = phases.findIndex((p) => p.label === "Create");

    expect(experiencesIdx).toBeGreaterThanOrEqual(0);
    expect(cardsIdx).toBe(experiencesIdx + 1);
    expect(createIdx).toBe(cardsIdx + 1);

    expect(phases[cardsIdx].steps).toEqual(["domain_cards_pick"]);
  });

  it("domain_cards_pick is a card_picker filtering level-1 domain_card rows by chosen class", () => {
    const step = DAGGERHEART_WIZARD_CONFIG.steps.domain_cards_pick;
    expect(step).toBeDefined();
    expect(step.component).toBe("card_picker");
    expect(step.dataSource?.table).toBe("compendium_abilities");
    expect(step.dataSource?.filter).toMatchObject({
      ability_type: "domain_card",
      level: 1,
    });
    // Cards are filtered by the chosen class via `classes contains <className>`.
    // Each card row carries `classes: ["ClassA","ClassB"]` (the two classes sharing the domain).
    expect(step.dataSource?.dependsOn).toBe("class_pick");
    expect(step.dataSource?.dependColumn).toBe("classes");
    expect(step.dataSource?.dependType).toBe("contains");
    expect(step.dataSource?.dependValueFrom).toBe("name");
  });

  it("domain_cards_pick declares a 2-card selection count", () => {
    const step = DAGGERHEART_WIZARD_CONFIG.steps.domain_cards_pick;
    expect(step.config).toMatchObject({ selectCount: 2 });
  });

  it("DAGGERHEART_EXPERIENCE_SUGGESTIONS contains the SRD spot-check examples per category", () => {
    // Sampled from Daggerheart SRD 9-09-25 page 5 STEP 7 "EXAMPLE EXPERIENCES".
    const byLabel = Object.fromEntries(
      DAGGERHEART_EXPERIENCE_SUGGESTIONS.map((s) => [s.label, s.items])
    );
    expect(byLabel.Backgrounds).toContain("Assassin");
    expect(byLabel.Backgrounds).toContain("High Priestess");
    expect(byLabel.Backgrounds).toContain("World Traveler");
    expect(byLabel.Characteristics).toContain("Battle-Hardened");
    expect(byLabel.Characteristics).toContain("Sticky Fingers");
    expect(byLabel.Specialties).toContain("Acrobat");
    expect(byLabel.Specialties).toContain("Master of Disguise");
    expect(byLabel.Skills).toContain("Animal Whisperer");
    expect(byLabel.Skills).toContain("Photographic Memory");
    expect(byLabel.Phrases).toContain("Catch Me If You Can");
    expect(byLabel.Phrases).toContain("Wolf in Sheep's Clothing");
  });
});
