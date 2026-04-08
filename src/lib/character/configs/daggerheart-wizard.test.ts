import { describe, it, expect } from "vitest";
import {
  DAGGERHEART_WIZARD_CONFIG,
  DAGGERHEART_CLASS_THEMES,
  DAGGERHEART_TRAIT_SLOTS,
  DAGGERHEART_STANDARD_ARRAY,
  DAGGERHEART_MARK_COUNT,
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

  it("standard array has 6 values summing to 6", () => {
    expect(DAGGERHEART_STANDARD_ARRAY).toHaveLength(6);
    expect(DAGGERHEART_STANDARD_ARRAY.reduce((a, b) => a + b, 0)).toBe(6);
  });

  it("mark count is 2", () => {
    expect(DAGGERHEART_MARK_COUNT).toBe(2);
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
});
