import { describe, it, expect } from "vitest";
import {
  DAGGERHEART_WIZARD_CONFIG,
  DAGGERHEART_CLASS_THEMES,
  DAGGERHEART_TRAIT_SLOTS,
  DAGGERHEART_STANDARD_ARRAY,
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

  it("has 5 phases", () => {
    expect(DAGGERHEART_WIZARD_CONFIG.phases).toHaveLength(5);
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
});
