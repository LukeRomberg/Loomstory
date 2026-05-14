import type { LucideIcon } from "lucide-react";

// ─── Wizard Step Config ─────────────────────────────────────

export interface WizardStepConfig {
  enabled: boolean;
  label: string;
  /** Compact label for the progress bar (defaults to `label` if omitted). */
  shortLabel?: string;
  subtitle?: string;
  helpText?: string;
  /** Registry key mapping to a component: "card_picker", "chip_selector", "stat_assigner", etc. */
  component: string;
  /** Where to fetch options from */
  dataSource?: {
    table: string;
    filter: Record<string, unknown>;
    /** Step key whose selected value becomes a filter */
    dependsOn?: string;
    /** Column to filter on using the dependsOn value */
    dependColumn?: string;
    /** How to apply the dependent filter — "eq" (default) for scalar columns, "contains" for array columns (e.g. classes[]) */
    dependType?: "eq" | "contains";
    /** Which property of the dependent step's selection to use — "id" (default) or "name" */
    dependValueFrom?: "id" | "name";
  };
  /** Component-specific configuration */
  config?: Record<string, unknown>;
  /** Conditional visibility */
  showWhen?: {
    /** Step key to check */
    dependsOn?: string;
    /** Exact value match on the step's selected value name */
    value?: string;
    /** Field in the selected class's data JSONB to check */
    classData?: string;
    /** Value to match against classData */
    equals?: unknown;
    /**
     * Generic wizard-state predicate. The step is shown only when
     * `wizardState[key] === equals`. Used for skipping the secondary weapon
     * step when the chosen primary weapon is Two-Handed.
     */
    requiresState?: {
      key: string;
      equals: unknown;
    };
  };
  /** How to save this step's data */
  write?: {
    target: string;
    mapping: Record<string, string>;
  };
}

// ─── Wizard Phase ───────────────────────────────────────────

export interface WizardPhase {
  label: string;
  steps: string[];
}

// ─── Full Wizard Config ─────────────────────────────────────

export interface ClassTheme {
  gradient: string;
  borderColor: string;
  textColor: string;
  icon: LucideIcon;
  domains?: string[];
}

export interface WizardConfig {
  steps: Record<string, WizardStepConfig>;
  phases: WizardPhase[];
  classThemes?: Record<string, ClassTheme>;
}

// ─── Wizard State ───────────────────────────────────────────

export interface WizardState {
  name: string;
  classId: string | null;
  className: string | null;
  subclassId: string | null;
  subclassName: string | null;
  /** Daggerheart ancestry name (e.g. "Faerie"). Names live in characters.data.ancestry. */
  ancestryName: string | null;
  /** Daggerheart community name (e.g. "Highborne"). Names live in characters.data.community. */
  communityName: string | null;
  /** Stat/trait assignments: stat_key → value */
  statValues: Record<string, number>;
  /** Narrative experiences (Daggerheart SRD step 7). Each grants a +2 modifier. */
  experiences: { name: string }[];
  /** Tier 1 primary weapon compendium_items id. */
  primaryWeaponId: string | null;
  /**
   * Mirror of the chosen primary weapon's data.type === "Two-Handed". Drives the
   * showWhen.requiresState predicate that skips weapon_secondary_pick when the
   * primary is 2H, without having to thread the loaded compendium_items list
   * into getVisibleSteps.
   */
  primaryWeaponIsTwoHanded: boolean;
  /** Tier 1 secondary weapon compendium_items id (only set when primary is One-Handed). */
  secondaryWeaponId: string | null;
  /** Tier 1 armor compendium_items id. */
  armorId: string | null;
  /** Chosen starting potion compendium_items id (Minor Health or Minor Stamina). */
  potionId: string | null;
  /** Free-text name of the chosen class-specific item (one of two per class). */
  classItemName: string | null;
  /** Multi-select choices: step_key → selected ids */
  selections: Record<string, string[]>;
  /** Class-specific config data */
  classConfig: Record<string, unknown>;
}

export function createEmptyWizardState(): WizardState {
  return {
    name: "",
    classId: null,
    className: null,
    subclassId: null,
    subclassName: null,
    ancestryName: null,
    communityName: null,
    statValues: {},
    experiences: [{ name: "" }, { name: "" }],
    primaryWeaponId: null,
    primaryWeaponIsTwoHanded: false,
    secondaryWeaponId: null,
    armorId: null,
    potionId: null,
    classItemName: null,
    selections: {},
    classConfig: {},
  };
}

// ─── Compendium Data Types ──────────────────────────────────

export interface CompendiumClass {
  id: string;
  name: string;
  is_subclass: boolean;
  parent_class_id: string | null;
  hp_die: string | null;
  data: Record<string, unknown>;
  source: string;
}

export interface CompendiumAbility {
  id: string;
  name: string;
  ability_type: string;
  description: string | null;
  level: number | null;
  classes: string[] | null;
  source: string | null;
  data: Record<string, unknown>;
}

export interface CompendiumItem {
  id: string;
  name: string;
  type: string;
  description: string | null;
  /** Typed JSONB — for weapons: tier/category/type/primary_trait/damage/range/feature. For armor: tier/base_score/thresholds/feature. */
  properties: Record<string, unknown>;
  source: string | null;
}
