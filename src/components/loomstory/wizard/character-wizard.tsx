"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { WizardModal } from "./wizard-modal";
import { WizardProgress } from "./wizard-progress";
import { StepHeading } from "./step-heading";
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
  CompendiumClass,
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

function classToPickerCard(
  cls: CompendiumClass,
  themes?: Record<string, { gradient: string; borderColor: string; textColor: string; domains?: string[] }>
): PickerCard {
  const theme = themes?.[cls.name];
  const data = cls.data as Record<string, unknown>;
  const stats: { label: string; value: string }[] = [];
  const details: { label: string; items: string[] }[] = [];

  if (data.hp_slots) stats.push({ label: "HP Slots", value: String(data.hp_slots) });
  if (data.evasion) stats.push({ label: "Evasion", value: String(data.evasion) });
  if (data.spellcast_trait) stats.push({ label: "Spellcast", value: String(data.spellcast_trait) });
  if (data.hp_die) stats.push({ label: "Hit Die", value: String(data.hp_die) });

  if (data.foundation_features && Array.isArray(data.foundation_features)) {
    details.push({ label: "Foundation Features", items: data.foundation_features as string[] });
  }

  const badges = theme?.domains?.map((d) => ({ label: d })) ??
    (data.domains && Array.isArray(data.domains)
      ? (data.domains as string[]).map((d) => ({ label: d }))
      : []);

  return {
    id: cls.id,
    title: cls.name,
    description: "", // Could add a description field to compendium_classes in the future
    badges,
    stats,
    details,
    gradient: theme?.gradient,
    borderColor: theme?.borderColor,
    textColor: theme?.textColor,
  };
}

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

  const { data: classesRaw, loading: classesLoading } = useStepData(
    classStepConfig,
    systemId
  );
  const { data: subclassesRaw, loading: subclassesLoading } = useStepData(
    subclassStepConfig,
    systemId,
    wizardState.classId
  );

  const classes = classesRaw as unknown as CompendiumClass[];
  const subclasses = subclassesRaw as unknown as CompendiumClass[];

  const selectedClass = classes.find((c) => c.id === wizardState.classId) ?? null;
  const selectedSubclass = subclasses.find((c) => c.id === wizardState.subclassId) ?? null;

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
      case "ancestry":
        return true; // optional
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
        ...(wizardState.textFields.ancestry
          ? [{ label: "Ancestry", value: wizardState.textFields.ancestry }]
          : []),
        ...(wizardState.textFields.community
          ? [{ label: "Community", value: wizardState.textFields.community }]
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
      const { characterId } = await saveNewCharacter({
        supabase,
        campaignId,
        systemId,
        userId,
        wizardState,
        selectedClass,
        selectedSubclass,
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

  // Reset when modal closes
  function handleClose() {
    setWizardState(createEmptyWizardState());
    setStepIndex(0);
    onClose();
  }

  // ─── Render ───────────────────────────────────────────────

  return (
    <WizardModal open={open} onClose={handleClose} title="Create Character">
      <WizardProgress phases={visiblePhases} currentStep={currentStepKey} />

      {/* ── Name step ── */}
      {currentStepKey === "name" && currentStep && (
        <div key="name" className="animate-fade-in space-y-6">
          <StepHeading
            title={currentStep.label}
            subtitle={currentStep.subtitle}
            helpText={currentStep.helpText}
          />
          <div className="flex flex-col items-center gap-4">
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
          </div>
          <WizardFooter onContinue={goForward} disabled={!canContinue()} />
        </div>
      )}

      {/* ── Class pick step ── */}
      {currentStepKey === "class_pick" && currentStep && (
        <div key="class_pick" className="animate-fade-in space-y-6">
          <BackButton onClick={goBack} />
          <StepHeading
            title={currentStep.label}
            subtitle={currentStep.subtitle}
            helpText={currentStep.helpText}
          />
          <CardPicker
            cards={classes.map((c) => classToPickerCard(c, wizardConfig.classThemes))}
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
        <div key="subclass_pick" className="animate-fade-in space-y-6">
          <BackButton onClick={goBack} />
          <StepHeading
            title={currentStep.label}
            subtitle={currentStep.subtitle}
            helpText={currentStep.helpText}
          />
          <CardPicker
            cards={subclasses.map((c) => classToPickerCard(c, wizardConfig.classThemes))}
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

      {/* ── Ancestry step ── */}
      {currentStepKey === "ancestry" && currentStep && (
        <div key="ancestry" className="animate-fade-in space-y-6">
          <BackButton onClick={goBack} />
          <StepHeading
            title={currentStep.label}
            subtitle={currentStep.subtitle}
            helpText={currentStep.helpText}
          />
          <TextFieldGroup
            fields={(currentStep.config?.fields as { key: string; label: string; placeholder?: string }[]) ?? []}
            values={wizardState.textFields}
            onChange={(vals) =>
              setWizardState((prev) => ({
                ...prev,
                textFields: { ...prev.textFields, ...vals },
              }))
            }
          />
          <WizardFooter onContinue={goForward} />
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
            />
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
          />
          <ReviewSummary
            sections={buildReviewSections()}
            onCreate={handleCreate}
            creating={creating}
          />
        </div>
      )}
    </WizardModal>
  );
}
