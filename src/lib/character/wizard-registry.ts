import type { WizardConfig } from "./wizard-types";
import { DAGGERHEART_WIZARD_CONFIG } from "./configs/daggerheart-wizard";

const WIZARD_CONFIGS: Record<string, WizardConfig> = {
  daggerheart: DAGGERHEART_WIZARD_CONFIG,
};

export function getWizardConfig(systemSlug: string): WizardConfig | null {
  return WIZARD_CONFIGS[systemSlug] ?? null;
}

/**
 * Returns the ordered list of visible step keys for the given config and wizard state.
 * Filters out disabled steps and steps whose `showWhen` condition is not met.
 */
export function getVisibleSteps(
  config: WizardConfig,
  wizardState: {
    subclassName?: string | null;
    className?: string | null;
    classData?: Record<string, unknown>;
  }
): string[] {
  const allStepKeys: string[] = [];
  for (const phase of config.phases) {
    allStepKeys.push(...phase.steps);
  }

  return allStepKeys.filter((key) => {
    const step = config.steps[key];
    if (!step || !step.enabled) return false;

    if (step.showWhen) {
      const { dependsOn, value, classData, equals } = step.showWhen;

      // Check value match (e.g., subclass name)
      if (value != null) {
        const stateVal =
          dependsOn === "subclass_pick"
            ? wizardState.subclassName
            : dependsOn === "class_pick"
              ? wizardState.className
              : null;
        if (stateVal !== value) return false;
      }

      // Check class data field
      if (classData != null && equals != null) {
        const dataVal = wizardState.classData?.[classData];
        if (dataVal !== equals) return false;
      }
    }

    return true;
  });
}
