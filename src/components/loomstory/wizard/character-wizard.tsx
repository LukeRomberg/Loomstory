"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { WizardModal } from "./wizard-modal";
import { WizardProgress } from "./wizard-progress";
import { StepHeading } from "./step-heading";
import { HelpPopup } from "./help-popup";
import { BackButton } from "./back-button";
import { WizardFooter } from "./wizard-footer";
import { CardPicker } from "./card-picker";
import type { PickerCard } from "./card-picker";
import { StatAssigner } from "./stat-assigner";
import { ExperienceInput } from "./experience-input";
import type { ExperienceSuggestionGroup } from "./experience-input";
import { CharacterSheetPreview } from "./character-sheet-preview";
import { useStepData } from "@/lib/character/use-step-data";
import { getVisibleSteps } from "@/lib/character/wizard-registry";
import { saveNewCharacter } from "@/lib/character/save-new-character";
import type {
  WizardConfig,
  WizardState,
  WizardStepConfig,
  ClassTheme,
  CompendiumClass,
  CompendiumAbility,
  CompendiumItem,
} from "@/lib/character/wizard-types";
import { createEmptyWizardState } from "@/lib/character/wizard-types";
import {
  DAGGERHEART_CLASS_ITEMS,
  DAGGERHEART_BASIC_SUPPLY_NAMES,
} from "@/lib/character/configs/daggerheart-wizard";

// ─── Props ──────────────────────────────────────────────────

interface CharacterWizardProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  systemId: string;
  systemSlug: string;
  userId: string;
  wizardConfig: WizardConfig;
}

// ─── Helpers ────────────────────────────────────────────────

function classToPickerCard(
  cls: CompendiumClass,
  classFeatures: CompendiumAbility[],
  themes?: Record<string, ClassTheme>
): PickerCard {
  const theme = themes?.[cls.name];
  const data = cls.data as Record<string, unknown>;
  const stats: { label: string; value: string }[] = [];

  if (data.hp_slots) stats.push({ label: "HP Slots", value: String(data.hp_slots) });
  if (data.evasion) stats.push({ label: "Evasion", value: String(data.evasion) });
  if (data.spellcast_trait) stats.push({ label: "Spellcast", value: String(data.spellcast_trait) });
  if (data.hp_die) stats.push({ label: "Hit Die", value: String(data.hp_die) });

  // Build feature groups — Hope Feature + Class Feature (with descriptions, from compendium)
  const featureGroups: PickerCard["featureGroups"] = [];
  const classOwnFeatures = classFeatures.filter((f) => f.classes?.includes(cls.name));

  const hopeFeatures = classOwnFeatures.filter(
    (f) => (f.data as Record<string, unknown>)?.feature_category === "hope_feature"
  );
  if (hopeFeatures.length > 0) {
    featureGroups.push({
      label: "Hope Feature",
      features: hopeFeatures.map((f) => ({
        name: stripPrefix(f.name, `${cls.name}: `),
        description: f.description ?? "",
      })),
    });
  }

  const classFeats = classOwnFeatures.filter(
    (f) => (f.data as Record<string, unknown>)?.feature_category === "class_feature"
  );
  if (classFeats.length > 0) {
    featureGroups.push({
      label: "Class Feature",
      features: classFeats.map((f) => ({
        name: stripPrefix(f.name, `${cls.name}: `),
        description: f.description ?? "",
      })),
    });
  }

  const badges = theme?.domains?.map((d) => ({ label: d })) ??
    (data.domains && Array.isArray(data.domains)
      ? (data.domains as string[]).map((d) => ({ label: d }))
      : []);

  return {
    id: cls.id,
    title: cls.name,
    description: (data.description as string) ?? "",
    badges,
    stats,
    featureGroups,
    gradient: theme?.gradient,
    borderColor: theme?.borderColor,
    textColor: theme?.textColor,
  };
}

/** Strips a "{Prefix}" from the start of a name, returning the bare suffix. */
function stripPrefix(name: string, prefix: string): string {
  return name.startsWith(prefix) ? name.slice(prefix.length) : name;
}

const FEATURE_GROUP_LABELS = {
  foundation: "Foundation Feature",
  specialization: "Specialization Features",
  mastery: "Mastery Features",
} as const;

function subclassToPickerCard(
  sub: CompendiumClass,
  parentClass: CompendiumClass | null,
  features: CompendiumAbility[],
  themes?: Record<string, ClassTheme>
): PickerCard {
  // Inherit theme from parent class so subclass cards match the class palette
  const theme = parentClass ? themes?.[parentClass.name] : undefined;
  const data = sub.data as Record<string, unknown>;
  const parentData = (parentClass?.data ?? {}) as Record<string, unknown>;

  // Inherit stats from the parent class — players want a reminder of the class numbers
  const stats: { label: string; value: string }[] = [];
  if (parentData.hp_slots) stats.push({ label: "HP Slots", value: String(parentData.hp_slots) });
  if (parentData.evasion) stats.push({ label: "Evasion", value: String(parentData.evasion) });
  if (parentData.spellcast_trait) {
    stats.push({ label: "Spellcast", value: String(parentData.spellcast_trait) });
  }

  // Build feature groups (foundation / specialization / mastery)
  const featureGroups: PickerCard["featureGroups"] = [];
  const buckets: Array<keyof typeof FEATURE_GROUP_LABELS> = [
    "foundation",
    "specialization",
    "mastery",
  ];
  for (const bucket of buckets) {
    const bucketFeatures = features.filter((f) => {
      const fdata = f.data as Record<string, unknown>;
      return (
        fdata?.subclass === sub.name &&
        fdata?.feature_category === `${bucket}_feature`
      );
    });
    if (bucketFeatures.length === 0) continue;

    featureGroups.push({
      label: FEATURE_GROUP_LABELS[bucket],
      features: bucketFeatures.map((f) => ({
        name: stripPrefix(f.name, `${sub.name}: `),
        description: f.description ?? "",
      })),
    });
  }

  return {
    id: sub.id,
    title: sub.name,
    description: (data.description as string) ?? "",
    stats,
    featureGroups,
    gradient: theme?.gradient,
    borderColor: theme?.borderColor,
    textColor: theme?.textColor,
  };
}

/**
 * Returns the distinct values of `data[dataKey]` across a list of compendium feature rows.
 * Used to derive picker options for ancestries and communities — each ancestry has 2 feature
 * rows tagged with the same `data.ancestry` name; we collapse those into one card per group.
 */
function distinctDataValues(features: CompendiumAbility[], dataKey: string): string[] {
  const names = new Set<string>();
  for (const f of features) {
    const value = (f.data as Record<string, unknown>)?.[dataKey] as string | undefined;
    if (value) names.add(value);
  }
  return Array.from(names).sort();
}

/**
 * Build a picker card for a heritage option (ancestry or community).
 *
 * NOTE: PickerCard.id is the heritage NAME (e.g. "Faerie"), not a UUID — ancestries and
 * communities don't have stable per-row UUIDs in wizard state; the name is what we store
 * in characters.data.ancestry / .community and use for filtering features on save.
 */
function heritageToPickerCard(
  value: string,
  dataKey: string,
  groupLabel: string,
  allFeatures: CompendiumAbility[],
  theme?: ClassTheme
): PickerCard {
  const features = allFeatures.filter(
    (f) => (f.data as Record<string, unknown>)?.[dataKey] === value
  );

  // Flavor paragraph from any feature row that carries it (the seed stores the same
  // flavor on every row for an ancestry, but reading any non-empty value is robust).
  const flavor = features
    .map((f) => (f.data as Record<string, unknown>)?.flavor as string | undefined)
    .find((v) => typeof v === "string" && v.length > 0) ?? "";

  // Personality adjectives (community cards only; ancestry rows don't carry this).
  const adjectives = features
    .map((f) => (f.data as Record<string, unknown>)?.adjectives as unknown)
    .find((v): v is string[] => Array.isArray(v) && v.length > 0);

  const details: PickerCard["details"] = adjectives
    ? [{ label: "Personality", items: adjectives }]
    : undefined;

  return {
    id: value,
    title: value,
    description: flavor,
    details,
    featureGroups:
      features.length > 0
        ? [
            {
              label: groupLabel,
              features: features.map((f) => ({
                name: stripPrefix(f.name, `${value}: `),
                description: f.description ?? "",
              })),
            },
          ]
        : [],
    gradient: theme?.gradient,
    borderColor: theme?.borderColor,
    textColor: theme?.textColor,
  };
}

/**
 * Build a picker card for a compendium_items weapon row. Surfaces the SRD stats
 * the player needs to decide: damage dice, range, trait, and the special feature
 * text (Reliable, Paired, Protective, etc.).
 */
/** Arcane violet palette used by magic-weapon picker cards. Overrides the
 *  class theme so spellcasters can spot magic weapons at a glance. */
const MAGIC_WEAPON_THEME: ClassTheme = {
  gradient: "from-violet-950 via-purple-900 to-violet-950",
  borderColor: "border-violet-500",
  textColor: "text-violet-200",
  icon: null as unknown as ClassTheme["icon"],
  domains: [],
};

function weaponToPickerCard(item: CompendiumItem, theme?: ClassTheme): PickerCard {
  const props = (item.properties ?? {}) as Record<string, unknown>;
  const isMagic = props.damage_type === "magic";
  const cardTheme = isMagic ? MAGIC_WEAPON_THEME : theme;

  const stats: { label: string; value: string }[] = [];
  if (props.damage) stats.push({ label: "Damage", value: String(props.damage) });
  if (props.range) stats.push({ label: "Range", value: String(props.range) });
  if (props.primary_trait) stats.push({ label: "Trait", value: String(props.primary_trait) });
  if (props.type) stats.push({ label: "Hands", value: String(props.type) });

  const featureText = (props.feature as string | null | undefined) ?? null;
  const featureGroups: PickerCard["featureGroups"] = featureText
    ? [{ label: "Feature", features: [{ name: stripPrefix(featureText, ""), description: "" }] }]
    : undefined;

  const badges: PickerCard["badges"] = isMagic
    ? [{ label: "Magic", className: "bg-violet-900/60 text-violet-100 border border-violet-500/40" }]
    : undefined;

  return {
    id: item.id,
    title: item.name,
    description: item.description ?? "",
    badges,
    stats,
    featureGroups,
    gradient: cardTheme?.gradient,
    borderColor: cardTheme?.borderColor,
    textColor: cardTheme?.textColor,
  };
}

/**
 * Build a picker card for a compendium_items armor row. Surfaces Base Score and
 * damage Thresholds — the two numbers that drive Daggerheart's damage math.
 */
function armorToPickerCard(item: CompendiumItem, theme?: ClassTheme): PickerCard {
  const props = (item.properties ?? {}) as Record<string, unknown>;
  const stats: { label: string; value: string }[] = [];
  if (props.base_score != null) stats.push({ label: "Base Score", value: String(props.base_score) });
  if (props.thresholds) stats.push({ label: "Thresholds", value: String(props.thresholds) });

  const featureText = (props.feature as string | null | undefined) ?? null;
  const featureGroups: PickerCard["featureGroups"] = featureText
    ? [{ label: "Feature", features: [{ name: featureText, description: "" }] }]
    : undefined;

  return {
    id: item.id,
    title: item.name,
    description: item.description ?? "",
    stats,
    featureGroups,
    gradient: theme?.gradient,
    borderColor: theme?.borderColor,
    textColor: theme?.textColor,
  };
}

/** Build a picker card for a potion (consumable). Description carries the effect text. */
function potionToPickerCard(item: CompendiumItem, theme?: ClassTheme): PickerCard {
  return {
    id: item.id,
    title: item.name,
    description: item.description ?? "",
    gradient: theme?.gradient,
    borderColor: theme?.borderColor,
    textColor: theme?.textColor,
  };
}

/**
 * Build a picker card for a free-text class item option. There's no compendium
 * row behind these, so the option string itself is both the id and the title.
 */
function classItemToPickerCard(option: string, theme?: ClassTheme): PickerCard {
  return {
    id: option,
    title: option,
    description: "",
    gradient: theme?.gradient,
    borderColor: theme?.borderColor,
    textColor: theme?.textColor,
  };
}

/**
 * Build a picker card for a level-1 domain card. Title = card name, badges show
 * the domain and recall cost, description is the rules text from the compendium.
 */
function domainCardToPickerCard(card: CompendiumAbility, theme?: ClassTheme): PickerCard {
  const data = (card.data ?? {}) as Record<string, unknown>;
  const badges: PickerCard["badges"] = [];
  if (data.domain) badges.push({ label: String(data.domain) });
  if (data.recall_cost != null) badges.push({ label: `Recall ${data.recall_cost}` });
  if (data.card_type) badges.push({ label: String(data.card_type) });

  return {
    id: card.id,
    title: card.name,
    description: card.description ?? "",
    badges,
    gradient: theme?.gradient,
    borderColor: theme?.borderColor,
    textColor: theme?.textColor,
  };
}

/**
 * Synthetic step config for fetching ALL class features for the system.
 * No dependsOn — fetched up-front so every class card can render its features.
 */
const CLASS_FEATURES_STEP_CONFIG: WizardStepConfig = {
  enabled: true,
  label: "Class Features (internal)",
  component: "ability_picker",
  dataSource: {
    table: "compendium_abilities",
    filter: { ability_type: "class_feature" },
  },
};

/**
 * Synthetic step config for fetching subclass features for the selected class.
 * Subclass features in compendium_abilities have `classes` as a text array
 * containing the parent class name, so we filter via .contains().
 */
const SUBCLASS_FEATURES_STEP_CONFIG: WizardStepConfig = {
  enabled: true,
  label: "Subclass Features (internal)",
  component: "ability_picker",
  dataSource: {
    table: "compendium_abilities",
    filter: { ability_type: "subclass_feature" },
    dependsOn: "class_pick",
    dependColumn: "classes",
    dependType: "contains",
    dependValueFrom: "name",
  },
};

// ─── Component ──────────────────────────────────────────────

export function CharacterWizard({
  open,
  onClose,
  campaignId,
  systemId,
  systemSlug,
  userId,
  wizardConfig,
}: CharacterWizardProps) {
  const router = useRouter();

  // State
  const [wizardState, setWizardState] = useState<WizardState>(createEmptyWizardState());
  const [creating, setCreating] = useState(false);
  // Help popup: auto-opens on first entry to each step, dismissal is sticky for the
  // life of the modal. Clicking the ? icon re-opens manually without resetting the set.
  const [showHelp, setShowHelp] = useState(false);
  const [dismissedHelpSteps, setDismissedHelpSteps] = useState<Set<string>>(() => new Set());

  // Visible steps (filtered by conditions). Equipment's secondary-weapon step uses
  // `showWhen.requiresState` keyed on `primaryWeaponIsTwoHanded`, so that bit feeds
  // directly into the visibility computation.
  const visibleSteps = useMemo(
    () => getVisibleSteps(wizardConfig, {
      className: wizardState.className,
      subclassName: wizardState.subclassName,
      primaryWeaponIsTwoHanded: wizardState.primaryWeaponIsTwoHanded,
    }),
    [
      wizardConfig,
      wizardState.className,
      wizardState.subclassName,
      wizardState.primaryWeaponIsTwoHanded,
    ]
  );
  const [stepIndex, setStepIndex] = useState(0);
  const currentStepKey = visibleSteps[stepIndex] ?? visibleSteps[0];
  const currentStep = wizardConfig.steps[currentStepKey];

  // One labeled entry per visible step for the progress bar
  const progressSteps = useMemo(() => {
    return visibleSteps.map((key) => {
      const step = wizardConfig.steps[key];
      return { key, label: step?.shortLabel ?? step?.label ?? key };
    });
  }, [visibleSteps, wizardConfig.steps]);

  // Data fetching
  const classStepConfig = wizardConfig.steps.class_pick;
  const subclassStepConfig = wizardConfig.steps.subclass_pick;
  const ancestryStepConfig = wizardConfig.steps.ancestry_pick;
  const communityStepConfig = wizardConfig.steps.community_pick;
  // Equipment step configs — each fetches all rows of the listed type and the
  // component narrows by tier/category client-side (useStepData can't filter
  // on JSONB `properties`).
  const weaponPrimaryStepConfig = wizardConfig.steps.weapon_primary_pick;
  const weaponSecondaryStepConfig = wizardConfig.steps.weapon_secondary_pick;
  const armorStepConfig = wizardConfig.steps.armor_pick;
  const potionStepConfig = wizardConfig.steps.potion_pick;
  const domainCardsStepConfig = wizardConfig.steps.domain_cards_pick;

  const { data: classesRaw, loading: classesLoading, error: classesError } = useStepData(
    classStepConfig,
    systemId
  );
  const { data: subclassesRaw, loading: subclassesLoading, error: subclassesError } = useStepData(
    subclassStepConfig,
    systemId,
    wizardState.classId
  );
  // Fetch all class features up-front — feeds the class card detail view (Hope Feature + Class Feature)
  const { data: classFeaturesRaw, error: classFeaturesError } = useStepData(
    CLASS_FEATURES_STEP_CONFIG,
    systemId
  );
  // Fetch all subclass features for the selected class — feeds the subclass card detail view
  const { data: subclassFeaturesRaw, error: subclassFeaturesError } = useStepData(
    SUBCLASS_FEATURES_STEP_CONFIG,
    systemId,
    wizardState.className
  );
  // Fetch ancestry features and community features up-front (no dependency)
  const { data: ancestryFeaturesRaw, loading: ancestryLoading, error: ancestryError } =
    useStepData(ancestryStepConfig, systemId);
  const { data: communityFeaturesRaw, loading: communityLoading, error: communityError } =
    useStepData(communityStepConfig, systemId);
  // Equipment fetches — same compendium_items table, scoped by `type` in the step
  // config. Each picker re-narrows by Tier 1 + category in-component.
  const { data: weaponsPrimaryRaw, loading: weaponsLoading, error: weaponsError } =
    useStepData(weaponPrimaryStepConfig, systemId);
  // The secondary step uses the same `type=weapon` filter, so we can reuse the
  // primary fetch and just narrow by category. Still call useStepData to keep the
  // contract (and to surface independent loading state if the API ever splits).
  const { data: weaponsSecondaryRaw } = useStepData(weaponSecondaryStepConfig, systemId);
  const { data: armorRaw, loading: armorLoading, error: armorError } =
    useStepData(armorStepConfig, systemId);
  const { data: potionsRaw, loading: potionsLoading, error: potionsError } =
    useStepData(potionStepConfig, systemId);
  // Domain cards — filtered to level 1 in the step config, scoped to the chosen
  // class via `classes contains <className>`. Fetch keys off className so swapping
  // class re-runs the query with the new domains.
  const { data: domainCardsRaw, loading: domainCardsLoading, error: domainCardsError } =
    useStepData(domainCardsStepConfig, systemId, wizardState.className);

  // Surface data fetch errors
  useEffect(() => {
    if (classesError) toast.error("Failed to load classes", { description: classesError });
  }, [classesError]);
  useEffect(() => {
    if (subclassesError) toast.error("Failed to load subclasses", { description: subclassesError });
  }, [subclassesError]);
  useEffect(() => {
    if (classFeaturesError) {
      toast.error("Failed to load class features", { description: classFeaturesError });
    }
  }, [classFeaturesError]);
  useEffect(() => {
    if (subclassFeaturesError) {
      toast.error("Failed to load subclass features", { description: subclassFeaturesError });
    }
  }, [subclassFeaturesError]);
  useEffect(() => {
    if (ancestryError) toast.error("Failed to load ancestries", { description: ancestryError });
  }, [ancestryError]);
  useEffect(() => {
    if (communityError) toast.error("Failed to load communities", { description: communityError });
  }, [communityError]);
  useEffect(() => {
    if (weaponsError) toast.error("Failed to load weapons", { description: weaponsError });
  }, [weaponsError]);
  useEffect(() => {
    if (armorError) toast.error("Failed to load armor", { description: armorError });
  }, [armorError]);
  useEffect(() => {
    if (potionsError) toast.error("Failed to load potions", { description: potionsError });
  }, [potionsError]);
  useEffect(() => {
    if (domainCardsError) toast.error("Failed to load domain cards", { description: domainCardsError });
  }, [domainCardsError]);

  // Auto-open the help popup the first time the user enters a step that has helpText.
  // Going back to a previously-dismissed step does NOT re-fire because the `if` guard
  // short-circuits when the step is already in dismissedHelpSteps — so it's safe to
  // include both deps for eslint compliance without changing observable behavior.
  useEffect(() => {
    const step = wizardConfig.steps[currentStepKey];
    if (step?.helpText && !dismissedHelpSteps.has(currentStepKey)) {
      setShowHelp(true);
    }
  }, [currentStepKey, wizardConfig.steps, dismissedHelpSteps]);

  const classes = classesRaw as unknown as CompendiumClass[];
  const subclasses = subclassesRaw as unknown as CompendiumClass[];
  const classFeatures = classFeaturesRaw as unknown as CompendiumAbility[];
  const subclassFeatures = subclassFeaturesRaw as unknown as CompendiumAbility[];
  const ancestryFeatures = ancestryFeaturesRaw as unknown as CompendiumAbility[];
  const communityFeatures = communityFeaturesRaw as unknown as CompendiumAbility[];

  const weaponsPrimaryAll = weaponsPrimaryRaw as unknown as CompendiumItem[];
  const weaponsSecondaryAll = weaponsSecondaryRaw as unknown as CompendiumItem[];
  const armorsAll = armorRaw as unknown as CompendiumItem[];
  const potionsAll = potionsRaw as unknown as CompendiumItem[];
  const domainCards = domainCardsRaw as unknown as CompendiumAbility[];
  const pickedDomainCardIds = wizardState.selections.domain_cards_pick ?? [];
  const selectedDomainCards = domainCards.filter((c) => pickedDomainCardIds.includes(c.id));

  // Narrow weapons + armor to Tier 1 by category. The compendium has tiers 1–4
  // for both, but step 5 of the SRD only allows Tier 1 selections at level 1.
  // Magic weapons require a spellcast trait per the SRD, so we hide them
  // entirely for classes without one (Warrior + Guardian).
  const pickedClass = classes.find((c) => c.id === wizardState.classId);
  const canUseMagic =
    (pickedClass?.data as Record<string, unknown> | undefined)?.spellcast_trait != null;
  const isPhysicalOrAllowedMagic = (w: CompendiumItem) => {
    if (canUseMagic) return true;
    const p = (w.properties ?? {}) as Record<string, unknown>;
    return p.damage_type !== "magic";
  };
  const primaryWeapons = weaponsPrimaryAll.filter((w) => {
    const p = (w.properties ?? {}) as Record<string, unknown>;
    return p.tier === 1 && p.category === "Primary" && isPhysicalOrAllowedMagic(w);
  });
  const secondaryWeapons = weaponsSecondaryAll.filter((w) => {
    const p = (w.properties ?? {}) as Record<string, unknown>;
    return p.tier === 1 && p.category === "Secondary" && isPhysicalOrAllowedMagic(w);
  });
  const tier1Armor = armorsAll.filter(
    (a) => ((a.properties ?? {}) as Record<string, unknown>).tier === 1
  );
  // Only the two SRD-step-5 starting potions, not the wider consumable list.
  const startingPotions = potionsAll.filter((p) =>
    ["Minor Health Potion", "Minor Stamina Potion"].includes(p.name)
  );

  const selectedPrimaryWeapon = primaryWeapons.find((w) => w.id === wizardState.primaryWeaponId) ?? null;
  const selectedSecondaryWeapon = secondaryWeapons.find((w) => w.id === wizardState.secondaryWeaponId) ?? null;
  const selectedArmor = tier1Armor.find((a) => a.id === wizardState.armorId) ?? null;
  const selectedPotion = startingPotions.find((p) => p.id === wizardState.potionId) ?? null;

  const selectedClass = classes.find((c) => c.id === wizardState.classId) ?? null;
  const selectedSubclass = subclasses.find((c) => c.id === wizardState.subclassId) ?? null;

  // Feature lists narrowed to what the preview screen needs to render — pre-computed
  // here so the JSX stays declarative and the same filtered slice is reused on save.
  const selectedAncestryFeatures = ancestryFeatures.filter(
    (f) => (f.data as Record<string, unknown>)?.ancestry === wizardState.ancestryName
  );
  const selectedCommunityFeatures = communityFeatures.filter(
    (f) => (f.data as Record<string, unknown>)?.community === wizardState.communityName
  );
  const selectedClassFeatures = classFeatures.filter(
    (f) => f.classes?.includes(wizardState.className ?? "")
  );
  // Subclass foundation features only — preview shows the level-1 feature; spec/mastery
  // appear later via level-up.
  const selectedSubclassFoundationFeatures = subclassFeatures.filter((f) => {
    const data = f.data as Record<string, unknown>;
    return (
      data?.subclass === wizardState.subclassName &&
      data?.feature_category === "foundation_feature"
    );
  });
  // Theme of the chosen class — propagated to heritage cards and the trait container so the
  // rest of the wizard reflects the player's class choice.
  const classTheme: ClassTheme | undefined = selectedClass
    ? wizardConfig.classThemes?.[selectedClass.name]
    : undefined;

  // Navigation
  const goBack = useCallback(() => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  }, [stepIndex]);

  const goForward = useCallback(() => {
    if (stepIndex < visibleSteps.length - 1) setStepIndex((i) => i + 1);
  }, [stepIndex, visibleSteps.length]);

  // Can continue validation
  function canContinue(): boolean {
    switch (currentStepKey) {
      case "class_pick":
        return wizardState.classId !== null;
      case "subclass_pick":
        return wizardState.subclassId !== null;
      case "ancestry_pick":
        return wizardState.ancestryName !== null;
      case "community_pick":
        return wizardState.communityName !== null;
      case "weapon_primary_pick":
        return wizardState.primaryWeaponId !== null;
      case "weapon_secondary_pick":
        return wizardState.secondaryWeaponId !== null;
      case "armor_pick":
        return wizardState.armorId !== null;
      case "potion_pick":
        return wizardState.potionId !== null;
      case "class_item_pick":
        return wizardState.classItemName !== null;
      case "traits": {
        const cfg = currentStep?.config as { slots?: { key: string }[] } | undefined;
        const slotCount = cfg?.slots?.length ?? 6;
        return Object.keys(wizardState.statValues).length === slotCount;
      }
      case "experiences_pick": {
        const cfg = currentStep?.config as { count?: number } | undefined;
        const required = cfg?.count ?? 2;
        const filled = wizardState.experiences.filter(
          (e) => e.name.trim().length > 0
        ).length;
        return filled >= required;
      }
      case "domain_cards_pick": {
        const cfg = currentStep?.config as { selectCount?: number } | undefined;
        const required = cfg?.selectCount ?? 2;
        return pickedDomainCardIds.length === required;
      }
      default:
        return true;
    }
  }

  // Save handler
  async function handleCreate() {
    setCreating(true);
    try {
      const supabase = createClient();

      // Resolve the four basic-supply compendium ids by name. These rows are seeded
      // by migration 20260514000003 and are referenced via compendium_item_ref_id on
      // the character_items inserts.
      const basicSupplyIds: Record<string, string> = {};
      const supplyNames = [...DAGGERHEART_BASIC_SUPPLY_NAMES];
      const { data: supplyRows, error: supplyError } = await supabase
        .from("compendium_items")
        .select("id,name")
        .eq("system_id", systemId)
        .eq("source", "Daggerheart SRD")
        .in("name", supplyNames);
      if (supplyError) {
        throw new Error(`Failed to look up starting supplies: ${supplyError.message}`);
      }
      for (const row of supplyRows ?? []) {
        basicSupplyIds[(row as { name: string }).name] = (row as { id: string }).id;
      }

      const { characterId } = await saveNewCharacter({
        supabase,
        campaignId,
        systemId,
        userId,
        wizardState,
        selectedClass,
        selectedSubclass,
        ancestryFeatures: selectedAncestryFeatures,
        communityFeatures: selectedCommunityFeatures,
        classFeatures: selectedClassFeatures,
        subclassFeatures: selectedSubclassFoundationFeatures,
        primaryWeapon: selectedPrimaryWeapon,
        secondaryWeapon: selectedSecondaryWeapon,
        armor: selectedArmor,
        potion: selectedPotion,
        classItemName: wizardState.classItemName,
        basicSupplyIds,
        domainCards: selectedDomainCards,
      });

      toast.success("Character created");
      onClose();
      router.push(`/campaign/${campaignId}/characters/${characterId}`);
    } catch (err) {
      toast.error("Failed to create character", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setCreating(false);
    }
  }

  // Reset when modal closes (including the help-popup state — popups should re-fire if the
  // wizard is opened again).
  function handleClose() {
    setWizardState(createEmptyWizardState());
    setStepIndex(0);
    setShowHelp(false);
    setDismissedHelpSteps(new Set());
    onClose();
  }

  // Help popup handlers
  function handleHelpClose() {
    setShowHelp(false);
    setDismissedHelpSteps((prev) => {
      if (prev.has(currentStepKey)) return prev;
      const next = new Set(prev);
      next.add(currentStepKey);
      return next;
    });
  }
  function handleHelpOpen() {
    setShowHelp(true);
  }

  // ─── Render ───────────────────────────────────────────────

  return (
    <WizardModal open={open} onClose={handleClose} title="Create Character">
      <WizardProgress steps={progressSteps} currentStep={currentStepKey} />

      {/* ── Class pick step ── */}
      {currentStepKey === "class_pick" && currentStep && (
        <div key="class_pick" className="animate-fade-in flex flex-col gap-6 flex-1 min-h-0">
          <BackButton onClick={goBack} />
          <StepHeading
            title={currentStep.label}
            subtitle={currentStep.subtitle}
            helpText={currentStep.helpText}
            onHelpClick={handleHelpOpen}
          />
          <CardPicker
            cards={classes.map((c) => classToPickerCard(c, classFeatures, wizardConfig.classThemes))}
            loading={classesLoading}
            selectedId={wizardState.classId ?? undefined}
            onSelect={(id) => {
              const cls = classes.find((c) => c.id === id);
              setWizardState((prev) => {
                // Same-class re-pick preserves all downstream selections;
                // a class CHANGE clears everything class-scoped (subclass,
                // class-specific item, domain cards) to avoid silently
                // saving stale ids from the previous class's pickers.
                const isChange = prev.classId !== null && prev.classId !== id;
                return {
                  ...prev,
                  classId: id,
                  className: cls?.name ?? null,
                  ...(isChange && {
                    subclassId: null,
                    subclassName: null,
                    classItemName: null,
                    selections: { ...prev.selections, domain_cards_pick: [] },
                  }),
                };
              });
              goForward();
            }}
          />
        </div>
      )}

      {/* ── Subclass pick step ── */}
      {currentStepKey === "subclass_pick" && currentStep && (
        <div key="subclass_pick" className="animate-fade-in flex flex-col gap-6 flex-1 min-h-0">
          <BackButton onClick={goBack} />
          <StepHeading
            title={currentStep.label}
            subtitle={currentStep.subtitle}
            helpText={currentStep.helpText}
            onHelpClick={handleHelpOpen}
          />
          <CardPicker
            cards={subclasses.map((c) =>
              subclassToPickerCard(c, selectedClass, subclassFeatures, wizardConfig.classThemes)
            )}
            loading={subclassesLoading}
            columns={2}
            selectedId={wizardState.subclassId ?? undefined}
            onSelect={(id) => {
              const sub = subclasses.find((c) => c.id === id);
              setWizardState((prev) => ({
                ...prev,
                subclassId: id,
                subclassName: sub?.name ?? null,
              }));
              goForward();
            }}
            selectLabel="Choose"
          />
        </div>
      )}

      {/* ── Ancestry pick step ── */}
      {currentStepKey === "ancestry_pick" && currentStep && (
        <div key="ancestry_pick" className="animate-fade-in flex flex-col gap-6 flex-1 min-h-0">
          <BackButton onClick={goBack} />
          <StepHeading
            title={currentStep.label}
            subtitle={currentStep.subtitle}
            helpText={currentStep.helpText}
            onHelpClick={handleHelpOpen}
          />
          <CardPicker
            cards={distinctDataValues(ancestryFeatures, "ancestry").map((name) =>
              heritageToPickerCard(name, "ancestry", "Ancestry Features", ancestryFeatures, classTheme)
            )}
            loading={ancestryLoading}
            selectedId={wizardState.ancestryName ?? undefined}
            onSelect={(id) => {
              setWizardState((prev) => ({ ...prev, ancestryName: id }));
              goForward();
            }}
          />
        </div>
      )}

      {/* ── Community pick step ── */}
      {currentStepKey === "community_pick" && currentStep && (
        <div key="community_pick" className="animate-fade-in flex flex-col gap-6 flex-1 min-h-0">
          <BackButton onClick={goBack} />
          <StepHeading
            title={currentStep.label}
            subtitle={currentStep.subtitle}
            helpText={currentStep.helpText}
            onHelpClick={handleHelpOpen}
          />
          <CardPicker
            cards={distinctDataValues(communityFeatures, "community").map((name) =>
              heritageToPickerCard(name, "community", "Community Feature", communityFeatures, classTheme)
            )}
            loading={communityLoading}
            selectedId={wizardState.communityName ?? undefined}
            onSelect={(id) => {
              setWizardState((prev) => ({ ...prev, communityName: id }));
              goForward();
            }}
          />
        </div>
      )}

      {/* ── Equipment: primary weapon ── */}
      {currentStepKey === "weapon_primary_pick" && currentStep && (
        <div key="weapon_primary_pick" className="animate-fade-in flex flex-col gap-6 flex-1 min-h-0">
          <BackButton onClick={goBack} />
          <StepHeading
            title={currentStep.label}
            subtitle={currentStep.subtitle}
            helpText={currentStep.helpText}
            onHelpClick={handleHelpOpen}
          />
          <CardPicker
            cards={primaryWeapons.map((w) => weaponToPickerCard(w, classTheme))}
            loading={weaponsLoading}
            selectedId={wizardState.primaryWeaponId ?? undefined}
            onSelect={(id) => {
              const w = primaryWeapons.find((x) => x.id === id);
              const isTwoHanded =
                ((w?.properties ?? {}) as Record<string, unknown>).type === "Two-Handed";
              setWizardState((prev) => ({
                ...prev,
                primaryWeaponId: id,
                primaryWeaponIsTwoHanded: isTwoHanded,
                // When switching to 2H, clear any prior secondary selection so it
                // doesn't linger in review or get persisted on save.
                secondaryWeaponId: isTwoHanded ? null : prev.secondaryWeaponId,
              }));
              goForward();
            }}
          />
        </div>
      )}

      {/* ── Equipment: secondary weapon (only when primary is One-Handed) ── */}
      {currentStepKey === "weapon_secondary_pick" && currentStep && (
        <div key="weapon_secondary_pick" className="animate-fade-in flex flex-col gap-6 flex-1 min-h-0">
          <BackButton onClick={goBack} />
          <StepHeading
            title={currentStep.label}
            subtitle={currentStep.subtitle}
            helpText={currentStep.helpText}
            onHelpClick={handleHelpOpen}
          />
          <CardPicker
            cards={secondaryWeapons.map((w) => weaponToPickerCard(w, classTheme))}
            loading={weaponsLoading}
            selectedId={wizardState.secondaryWeaponId ?? undefined}
            onSelect={(id) => {
              setWizardState((prev) => ({ ...prev, secondaryWeaponId: id }));
              goForward();
            }}
          />
        </div>
      )}

      {/* ── Equipment: armor ── */}
      {currentStepKey === "armor_pick" && currentStep && (
        <div key="armor_pick" className="animate-fade-in flex flex-col gap-6 flex-1 min-h-0">
          <BackButton onClick={goBack} />
          <StepHeading
            title={currentStep.label}
            subtitle={currentStep.subtitle}
            helpText={currentStep.helpText}
            onHelpClick={handleHelpOpen}
          />
          <CardPicker
            cards={tier1Armor.map((a) => armorToPickerCard(a, classTheme))}
            loading={armorLoading}
            selectedId={wizardState.armorId ?? undefined}
            onSelect={(id) => {
              setWizardState((prev) => ({ ...prev, armorId: id }));
              goForward();
            }}
          />
        </div>
      )}

      {/* ── Equipment: starting potion ── */}
      {currentStepKey === "potion_pick" && currentStep && (
        <div key="potion_pick" className="animate-fade-in flex flex-col gap-6 flex-1 min-h-0">
          <BackButton onClick={goBack} />
          <StepHeading
            title={currentStep.label}
            subtitle={currentStep.subtitle}
            helpText={currentStep.helpText}
            onHelpClick={handleHelpOpen}
          />
          <CardPicker
            cards={startingPotions.map((p) => potionToPickerCard(p, classTheme))}
            loading={potionsLoading}
            columns={2}
            selectedId={wizardState.potionId ?? undefined}
            onSelect={(id) => {
              setWizardState((prev) => ({ ...prev, potionId: id }));
              goForward();
            }}
          />
        </div>
      )}

      {/* ── Equipment: class-specific item (free-text, hardcoded options) ── */}
      {currentStepKey === "class_item_pick" && currentStep && (
        <div key="class_item_pick" className="animate-fade-in flex flex-col gap-6 flex-1 min-h-0">
          <BackButton onClick={goBack} />
          <StepHeading
            title={currentStep.label}
            subtitle={currentStep.subtitle}
            helpText={currentStep.helpText}
            onHelpClick={handleHelpOpen}
          />
          <CardPicker
            cards={(DAGGERHEART_CLASS_ITEMS[wizardState.className ?? ""] ?? []).map((opt) =>
              classItemToPickerCard(opt, classTheme)
            )}
            columns={2}
            selectedId={wizardState.classItemName ?? undefined}
            onSelect={(id) => {
              setWizardState((prev) => ({ ...prev, classItemName: id }));
              goForward();
            }}
          />
        </div>
      )}

      {/* ── Traits step ── */}
      {currentStepKey === "traits" && currentStep && (() => {
        const cfg = currentStep.config as {
          slots: { key: string; label: string; group?: string }[];
          standardArray: number[];
        };
        return (
          <div key="traits" className="animate-fade-in space-y-6">
            <BackButton onClick={goBack} />
            <StepHeading
              title={currentStep.label}
              subtitle={currentStep.subtitle}
              helpText={currentStep.helpText}
              onHelpClick={handleHelpOpen}
            />
            <div
              className={cn(
                "rounded-xl border-2 p-5 bg-gradient-to-br",
                classTheme?.gradient ?? "from-zinc-900 to-zinc-800",
                classTheme?.borderColor ?? "border-rune/40"
              )}
            >
              <StatAssigner
                slots={cfg.slots}
                standardArray={cfg.standardArray}
                values={wizardState.statValues}
                onChange={(vals) =>
                  setWizardState((prev) => ({ ...prev, statValues: vals }))
                }
              />
            </div>
            <WizardFooter onContinue={goForward} disabled={!canContinue()} />
          </div>
        );
      })()}

      {/* ── Experiences step ── */}
      {currentStepKey === "experiences_pick" && currentStep && (() => {
        const cfg = currentStep.config as {
          count: number;
          modifier?: number;
          suggestions: ReadonlyArray<ExperienceSuggestionGroup>;
        };
        return (
          <div key="experiences_pick" className="animate-fade-in space-y-6">
            <BackButton onClick={goBack} />
            <StepHeading
              title={currentStep.label}
              subtitle={currentStep.subtitle}
              helpText={currentStep.helpText}
              onHelpClick={handleHelpOpen}
            />
            <div
              className={cn(
                "rounded-xl border-2 p-5 bg-gradient-to-br",
                classTheme?.gradient ?? "from-zinc-900 to-zinc-800",
                classTheme?.borderColor ?? "border-rune/40"
              )}
            >
              <ExperienceInput
                count={cfg.count}
                modifier={cfg.modifier}
                experiences={wizardState.experiences}
                suggestions={cfg.suggestions}
                onChange={(exps) =>
                  setWizardState((prev) => ({ ...prev, experiences: exps }))
                }
              />
            </div>
            <WizardFooter onContinue={goForward} disabled={!canContinue()} />
          </div>
        );
      })()}

      {/* ── Domain cards step (SRD step 8) ── */}
      {currentStepKey === "domain_cards_pick" && currentStep && (() => {
        const cfg = currentStep.config as { selectCount?: number } | undefined;
        const cap = cfg?.selectCount ?? 2;
        return (
          <div key="domain_cards_pick" className="animate-fade-in flex flex-col gap-6 flex-1 min-h-0">
            <BackButton onClick={goBack} />
            <StepHeading
              title={currentStep.label}
              subtitle={`${currentStep.subtitle ?? ""} (${pickedDomainCardIds.length}/${cap} chosen)`}
              helpText={currentStep.helpText}
              onHelpClick={handleHelpOpen}
            />
            <CardPicker
              cards={domainCards.map((c) => domainCardToPickerCard(c, classTheme))}
              loading={domainCardsLoading}
              onSelect={() => {
                /* unused in multi mode */
              }}
              multi={{ count: cap }}
              selectedIds={pickedDomainCardIds}
              onMultiChange={(ids) =>
                setWizardState((prev) => ({
                  ...prev,
                  selections: { ...prev.selections, domain_cards_pick: ids },
                }))
              }
            />
            <WizardFooter onContinue={goForward} disabled={!canContinue()} />
          </div>
        );
      })()}

      {/* ── Review step — cinematic preview + name input + Create CTA ── */}
      {currentStepKey === "review" && currentStep && (
        <div key="review" className="animate-fade-in space-y-4 flex-1 min-h-0 overflow-y-auto">
          <BackButton onClick={goBack} />
          <CharacterSheetPreview
            wizardState={wizardState}
            selectedClass={selectedClass}
            selectedSubclass={selectedSubclass}
            ancestryFeatures={selectedAncestryFeatures}
            communityFeatures={selectedCommunityFeatures}
            classFeatures={selectedClassFeatures}
            subclassFeatures={selectedSubclassFoundationFeatures}
            domainCards={selectedDomainCards}
            primaryWeapon={selectedPrimaryWeapon}
            secondaryWeapon={selectedSecondaryWeapon}
            armor={selectedArmor}
            potion={selectedPotion}
            classTheme={classTheme}
            onNameChange={(name) =>
              setWizardState((prev) => ({ ...prev, name }))
            }
            onCreate={handleCreate}
            creating={creating}
          />
        </div>
      )}

      {/* Help popup overlays whichever step is active (positioned via wizard-modal's relative wrapper) */}
      {currentStep?.helpText && (
        <HelpPopup
          open={showHelp}
          onClose={handleHelpClose}
          title={currentStep.label}
          helpText={currentStep.helpText}
        />
      )}
    </WizardModal>
  );
}
