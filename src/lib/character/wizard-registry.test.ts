import { describe, it, expect } from "vitest";
import { getWizardConfig, getVisibleSteps } from "./wizard-registry";

describe("getWizardConfig", () => {
  it("returns daggerheart config for 'daggerheart' slug", () => {
    const config = getWizardConfig("daggerheart");
    expect(config).not.toBeNull();
    expect(config!.phases.length).toBeGreaterThan(0);
  });

  it("returns null for unknown system slug", () => {
    expect(getWizardConfig("shadowrun")).toBeNull();
  });
});

describe("getVisibleSteps", () => {
  it("returns all enabled steps for daggerheart", () => {
    const config = getWizardConfig("daggerheart")!;
    const steps = getVisibleSteps(config, {});
    // weapon_secondary_pick is hidden by default (requiresState.primaryWeaponIsTwoHanded === false);
    // an empty wizardState has the field as undefined, so the predicate fails and the step
    // is filtered out. Picking a 1H primary at runtime sets the flag to false and the step
    // becomes visible.
    expect(steps).toEqual([
      "class_pick",
      "subclass_pick",
      "ancestry_pick",
      "community_pick",
      "weapon_primary_pick",
      "armor_pick",
      "potion_pick",
      "class_item_pick",
      "traits",
      "experiences_pick",
      "domain_cards_pick",
      "review",
    ]);
  });

  it("filters out steps with unmet showWhen conditions", () => {
    const config = getWizardConfig("daggerheart")!;
    // Add a conditional step
    const modifiedConfig = {
      ...config,
      steps: {
        ...config.steps,
        class_config: {
          enabled: true,
          label: "Companion",
          component: "companion_builder",
          showWhen: {
            dependsOn: "subclass_pick",
            value: "Beastbound",
          },
        },
      },
      phases: [
        ...config.phases.slice(0, 2),
        { label: "Config", steps: ["class_config"] },
        ...config.phases.slice(2),
      ],
    };

    // Without matching subclass
    const stepsWithout = getVisibleSteps(modifiedConfig, { subclassName: "Wayfinder" });
    expect(stepsWithout).not.toContain("class_config");

    // With matching subclass
    const stepsWith = getVisibleSteps(modifiedConfig, { subclassName: "Beastbound" });
    expect(stepsWith).toContain("class_config");
  });

  it("filters out disabled steps", () => {
    const config = getWizardConfig("daggerheart")!;
    const modifiedConfig = {
      ...config,
      steps: {
        ...config.steps,
        ancestry_pick: { ...config.steps.ancestry_pick, enabled: false },
      },
    };

    const steps = getVisibleSteps(modifiedConfig, {});
    expect(steps).not.toContain("ancestry_pick");
  });
});
