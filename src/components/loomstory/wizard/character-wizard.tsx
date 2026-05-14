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
import { TextFieldGroup } from "./text-field-group";
import { StatAssigner } from "./stat-assigner";
import { ReviewSummary } from "./review-summary";
import type { ReviewSection } from "./review-summary";
import { useStepData } from "@/lib/character/use-step-data";
import { getVisibleSteps } from "@/lib/character/wizard-registry";
import { saveNewCharacter } from "@/lib/character/save-new-character";
import type {
  WizardConfig,
  WizardState,
  WizardStepConfig,
  CompendiumClass,
  CompendiumAbility,
} from "@/lib/character/wizard-types";
import { createEmptyWizardState } from "@/lib/character/wizard-types";

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

type Theme = { gradient: string; borderColor: string; textColor: string; domains?: string[] };

function classToPickerCard(
  cls: CompendiumClass,
  classFeatures: CompendiumAbility[],
  themes?: Record<string, Theme>
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
  themes?: Record<string, Theme>
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
  theme?: Theme
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

  // Visible steps (filtered by conditions)
  const visibleSteps = useMemo(
    () => getVisibleSteps(wizardConfig, {
      className: wizardState.className,
      subclassName: wizardState.subclassName,
    }),
    [wizardConfig, wizardState.className, wizardState.subclassName]
  );
  const [stepIndex, setStepIndex] = useState(0);
  const currentStepKey = visibleSteps[stepIndex] ?? visibleSteps[0];
  const currentStep = wizardConfig.steps[currentStepKey];

  // Only compute phases that have at least one visible step
  const visiblePhases = useMemo(() => {
    return wizardConfig.phases
      .map((p) => ({
        ...p,
        steps: p.steps.filter((s) => visibleSteps.includes(s)),
      }))
      .filter((p) => p.steps.length > 0);
  }, [wizardConfig.phases, visibleSteps]);

  // Data fetching
  const classStepConfig = wizardConfig.steps.class_pick;
  const subclassStepConfig = wizardConfig.steps.subclass_pick;
  const ancestryStepConfig = wizardConfig.steps.ancestry_pick;
  const communityStepConfig = wizardConfig.steps.community_pick;

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

  // Auto-open the help popup the first time the user enters a step that has helpText.
  // Going back to a step they've already dismissed does NOT re-fire — that's why this
  // depends only on currentStepKey, not on dismissedHelpSteps.
  useEffect(() => {
    const step = wizardConfig.steps[currentStepKey];
    if (step?.helpText && !dismissedHelpSteps.has(currentStepKey)) {
      setShowHelp(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepKey]);

  const classes = classesRaw as unknown as CompendiumClass[];
  const subclasses = subclassesRaw as unknown as CompendiumClass[];
  const classFeatures = classFeaturesRaw as unknown as CompendiumAbility[];
  const subclassFeatures = subclassFeaturesRaw as unknown as CompendiumAbility[];
  const ancestryFeatures = ancestryFeaturesRaw as unknown as CompendiumAbility[];
  const communityFeatures = communityFeaturesRaw as unknown as CompendiumAbility[];

  const selectedClass = classes.find((c) => c.id === wizardState.classId) ?? null;
  const selectedSubclass = subclasses.find((c) => c.id === wizardState.subclassId) ?? null;
  // Theme of the chosen class — propagated to heritage cards and the trait container so the
  // rest of the wizard reflects the player's class choice.
  const classTheme: Theme | undefined = selectedClass
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
      case "name":
        return wizardState.name.trim().length > 0;
      case "class_pick":
        return wizardState.classId !== null;
      case "subclass_pick":
        return wizardState.subclassId !== null;
      case "ancestry_pick":
        return wizardState.ancestryName !== null;
      case "community_pick":
        return wizardState.communityName !== null;
      case "traits": {
        const cfg = currentStep?.config as { slots?: { key: string }[]; markCount?: number } | undefined;
        const slotCount = cfg?.slots?.length ?? 6;
        const markCount = cfg?.markCount ?? 0;
        return (
          Object.keys(wizardState.statValues).length === slotCount &&
          wizardState.markedKeys.length === markCount
        );
      }
      default:
        return true;
    }
  }

  // Build review sections
  function buildReviewSections(): ReviewSection[] {
    const sections: ReviewSection[] = [];

    sections.push({
      label: "Identity",
      items: [
        { label: "Name", value: wizardState.name },
        ...(wizardState.ancestryName
          ? [{ label: "Ancestry", value: wizardState.ancestryName }]
          : []),
        ...(wizardState.communityName
          ? [{ label: "Community", value: wizardState.communityName }]
          : []),
      ],
    });

    if (wizardState.className) {
      sections.push({
        label: "Path",
        items: [
          { label: "Class", value: wizardState.className },
          ...(wizardState.subclassName
            ? [{ label: "Subclass", value: wizardState.subclassName }]
            : []),
        ],
      });
    }

    if (Object.keys(wizardState.statValues).length > 0) {
      const cfg = wizardConfig.steps.traits?.config as { slots?: { key: string; label: string }[] } | undefined;
      const slots = cfg?.slots ?? [];
      sections.push({
        label: "Traits",
        items: slots
          .filter((s) => wizardState.statValues[s.key] != null)
          .map((s) => ({
            label: s.label,
            value: `${wizardState.statValues[s.key] >= 0 ? "+" : ""}${wizardState.statValues[s.key]}${wizardState.markedKeys.includes(s.key) ? " (marked)" : ""}`,
          })),
      });
    }

    return sections;
  }

  // Save handler
  async function handleCreate() {
    setCreating(true);
    try {
      const supabase = createClient();
      // Filter the loaded feature lists down to just the chosen ancestry's + community's features
      const selectedAncestryFeatures = ancestryFeatures.filter(
        (f) => (f.data as Record<string, unknown>)?.ancestry === wizardState.ancestryName
      );
      const selectedCommunityFeatures = communityFeatures.filter(
        (f) => (f.data as Record<string, unknown>)?.community === wizardState.communityName
      );
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
      <WizardProgress phases={visiblePhases} currentStep={currentStepKey} />

      {/* ── Name step ── */}
      {currentStepKey === "name" && currentStep && (
        <form
          key="name"
          className="animate-fade-in space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (canContinue()) goForward();
          }}
        >
          <StepHeading
            title={currentStep.label}
            subtitle={currentStep.subtitle}
            helpText={currentStep.helpText}
            onHelpClick={handleHelpOpen}
          />
          <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
            <TextFieldGroup
              fields={[
                {
                  key: "name",
                  label: "Character Name",
                  placeholder: "Enter a name...",
                },
              ]}
              values={{ name: wizardState.name }}
              onChange={(vals) =>
                setWizardState((prev) => ({ ...prev, name: vals.name ?? "" }))
              }
            />
            <WizardFooter onContinue={goForward} disabled={!canContinue()} />
          </div>
        </form>
      )}

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
              setWizardState((prev) => ({
                ...prev,
                classId: id,
                className: cls?.name ?? null,
                // Reset subclass when class changes
                subclassId: null,
                subclassName: null,
              }));
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

      {/* ── Traits step ── */}
      {currentStepKey === "traits" && currentStep && (() => {
        const cfg = currentStep.config as {
          slots: { key: string; label: string; group?: string }[];
          standardArray: number[];
          markCount: number;
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
                markCount={cfg.markCount}
                markedKeys={wizardState.markedKeys}
                onMarkedChange={(keys) =>
                  setWizardState((prev) => ({ ...prev, markedKeys: keys }))
                }
              />
            </div>
            <WizardFooter onContinue={goForward} disabled={!canContinue()} />
          </div>
        );
      })()}

      {/* ── Review step ── */}
      {currentStepKey === "review" && currentStep && (
        <div key="review" className="animate-fade-in space-y-6">
          <BackButton onClick={goBack} />
          <StepHeading
            title={currentStep.label}
            subtitle={currentStep.subtitle}
            helpText={currentStep.helpText}
            onHelpClick={handleHelpOpen}
          />
          <ReviewSummary
            sections={buildReviewSections()}
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
