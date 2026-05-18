"use client";

import { useState, useMemo } from "react";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import { cn } from "@/lib/utils";
import { CharacterCreationShell } from "./character-creation-shell";
import { CharacterSheetPreview } from "./character-sheet-preview";
import { WizardProgress } from "./wizard-progress";
import { Button } from "@/components/ui/button";
import { useStepData } from "@/lib/character/use-step-data";
import { getVisibleSteps } from "@/lib/character/wizard-registry";
import { DAGGERHEART_DOMAINS } from "@/lib/character/configs/daggerheart-wizard";
import type {
  WizardConfig,
  WizardState,
  CompendiumClass,
  CompendiumAbility,
  ClassTheme,
} from "@/lib/character/wizard-types";
import { createEmptyWizardState } from "@/lib/character/wizard-types";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CharacterCreationWizardProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  systemId: string;
  systemSlug: string;
  userId: string;
  wizardConfig: WizardConfig;
}

/**
 * Master-detail rebuild of the character creation flow.
 *
 * Sits next to the existing CharacterWizard (which stays the production
 * surface until this one is feature-complete). Mirrors the data + state
 * shape so we can swap the import in CharacterList when ready.
 *
 * Each picker step uses the same shape as NpcList / LocationList / Lore:
 *   - leftPage : vertical list of choices
 *   - rightPage: detail of the selected choice
 *   - sheetPage: live <CharacterSheetPreview>
 *   - topBar   : <WizardProgress>
 *   - footer   : Prev · Step n of m · Continue
 *
 * Phase 1 (this file's first cut): Class step is fully wired; the other
 * steps render a placeholder until they're built out.
 */
export function CharacterCreationWizard({
  open,
  onClose,
  campaignId: _campaignId,
  systemId,
  systemSlug,
  userId: _userId,
  wizardConfig,
}: CharacterCreationWizardProps) {
  const router = useTransitionRouter();
  const [wizardState, setWizardState] = useState<WizardState>(() =>
    createEmptyWizardState()
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [maxStepReached, setMaxStepReached] = useState(0);

  const visibleSteps = useMemo(
    () =>
      getVisibleSteps(wizardConfig, {
        className: wizardState.className,
        subclassName: wizardState.subclassName,
      }),
    [wizardConfig, wizardState]
  );
  const currentStepKey = visibleSteps[stepIndex] ?? "class_pick";
  const currentStep = wizardConfig.steps[currentStepKey];

  const progressSteps = useMemo(
    () =>
      visibleSteps.map((key) => ({
        key,
        label: wizardConfig.steps[key]?.shortLabel ?? wizardConfig.steps[key]?.label ?? key,
      })),
    [visibleSteps, wizardConfig]
  );

  // ─── Class step data ───────────────────────────────────────
  const classStep = wizardConfig.steps["class_pick"];
  const { data: classData, loading: classesLoading } = useStepData(
    classStep,
    systemId
  );
  const classes = classData as unknown as CompendiumClass[];
  const selectedClass =
    classes.find((c) => c.id === wizardState.classId) ?? null;

  const classFeaturesStep = wizardConfig.steps["class_features_view"];
  const { data: classFeatures } = useStepData(classFeaturesStep, systemId);
  const allClassFeatures = classFeatures as unknown as CompendiumAbility[];
  const selectedClassFeatures = allClassFeatures.filter((f) =>
    f.classes?.includes(wizardState.className ?? "")
  );

  const classTheme = selectedClass
    ? wizardConfig.classThemes?.[selectedClass.name]
    : undefined;

  // ─── Navigation ─────────────────────────────────────────────
  function goBack() {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  }
  function goForward() {
    if (stepIndex < visibleSteps.length - 1) {
      const next = stepIndex + 1;
      setStepIndex(next);
      setMaxStepReached((m) => Math.max(m, next));
    }
  }

  function canContinue(): boolean {
    if (currentStepKey === "class_pick") return wizardState.classId !== null;
    return true;
  }

  if (!open) return null;

  // ─── Per-step content ───────────────────────────────────────
  let leftPage: React.ReactNode = null;
  let rightPage: React.ReactNode = null;

  if (currentStepKey === "class_pick") {
    leftPage = (
      <ClassListPicker
        classes={classes}
        loading={classesLoading}
        selectedId={wizardState.classId}
        onSelect={(id) => {
          const cls = classes.find((c) => c.id === id);
          const isChange =
            wizardState.classId !== null && wizardState.classId !== id;
          setWizardState((prev) => ({
            ...prev,
            classId: id,
            className: cls?.name ?? null,
            ...(isChange && {
              subclassId: null,
              subclassName: null,
              classItemName: null,
              selections: { ...prev.selections, domain_cards_pick: [] },
            }),
          }));
          if (isChange) setMaxStepReached(stepIndex);
        }}
        title={currentStep?.label ?? "Class"}
        subtitle={currentStep?.subtitle ?? null}
      />
    );
    rightPage = selectedClass ? (
      <ClassDetailPanel
        klass={selectedClass}
        features={selectedClassFeatures}
        theme={classTheme}
      />
    ) : (
      <EmptyDetail message="Pick a class to see its details." />
    );
  } else {
    leftPage = (
      <ComingSoon
        title={currentStep?.label ?? currentStepKey}
        subtitle="This step is still on the old wizard. Coming soon."
      />
    );
    rightPage = (
      <EmptyDetail message="Switch back to the existing wizard to complete this step." />
    );
  }

  // ─── Render ─────────────────────────────────────────────────
  return (
    <CharacterCreationShell
      onClose={onClose}
      topBar={
        <WizardProgress
          steps={progressSteps}
          currentStep={currentStepKey}
          maxReachedIndex={maxStepReached}
          onStepClick={(key) => {
            const idx = visibleSteps.indexOf(key);
            if (idx >= 0 && idx !== stepIndex && idx <= maxStepReached) {
              setStepIndex(idx);
            }
          }}
        />
      }
      leftPage={leftPage}
      rightPage={rightPage}
      sheetPage={
        <CharacterSheetPreview
          wizardState={wizardState}
          selectedClass={selectedClass}
          selectedSubclass={null}
          ancestryFeatures={[]}
          communityFeatures={[]}
          classFeatures={selectedClassFeatures}
          subclassFeatures={[]}
          domainCards={[]}
          primaryWeapon={null}
          secondaryWeapon={null}
          armor={null}
          potion={null}
          classTheme={classTheme}
          onNameChange={(name) =>
            setWizardState((prev) => ({ ...prev, name }))
          }
          onCreate={() => {
            /* Review-step CTA — populated once the Review step is ported. */
          }}
        />
      }
      footer={
        <>
          <Button
            variant="ghost"
            onClick={goBack}
            disabled={stepIndex === 0}
            className="font-subheading text-gold/85 hover:text-gold"
          >
            <ChevronLeft className="mr-1 size-4" />
            Previous
          </Button>
          <span className="font-subheading text-xs uppercase tracking-[0.18em] text-gold/70">
            Step {stepIndex + 1} of {visibleSteps.length}
          </span>
          <Button
            onClick={goForward}
            disabled={!canContinue() || stepIndex >= visibleSteps.length - 1}
            className="gold-glow font-subheading"
          >
            Continue
            <ChevronRight className="ml-1 size-4" />
          </Button>
        </>
      }
    />
  );
}

// ─── Sub-components ─────────────────────────────────────────

function ClassListPicker({
  classes,
  loading,
  selectedId,
  onSelect,
  title,
  subtitle,
}: {
  classes: CompendiumClass[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  title: string;
  subtitle: string | null;
}) {
  return (
    <>
      <div className="shrink-0">
        <h2 className="font-heading text-xl font-bold uppercase tracking-[0.12em] text-leather">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 font-lore text-sm font-medium text-leather/75">
            {subtitle}
          </p>
        )}
      </div>
      <div className="scrollbar-none mt-3 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {loading ? (
          <p className="text-sm italic text-leather/60">Loading classes…</p>
        ) : classes.length === 0 ? (
          <p className="text-sm italic text-leather/60">No classes available.</p>
        ) : (
          classes.map((c) => (
            <button
              key={c.id}
              aria-label={`Choose ${c.name}`}
              onClick={() => onSelect(c.id)}
              className={cn(
                "w-full rounded border px-3 py-2 text-left font-heading text-sm transition",
                selectedId === c.id
                  ? "border-leather/50 bg-leather/10 font-bold text-leather"
                  : "border-leather/15 text-leather/85 hover:bg-leather/5 hover:text-leather"
              )}
            >
              {c.name}
            </button>
          ))
        )}
      </div>
    </>
  );
}

function ClassDetailPanel({
  klass,
  features,
  theme,
}: {
  klass: CompendiumClass;
  features: CompendiumAbility[];
  theme?: ClassTheme;
}) {
  const Icon = theme?.icon;
  const data = klass.data as Record<string, unknown>;
  const description = (data.description as string) ?? "";

  const stats: { label: string; value: string }[] = [];
  if (data.hp_slots) stats.push({ label: "HP Slots", value: String(data.hp_slots) });
  if (data.evasion) stats.push({ label: "Evasion", value: String(data.evasion) });
  if (data.spellcast_trait)
    stats.push({ label: "Spellcast", value: String(data.spellcast_trait) });
  if (data.hp_die) stats.push({ label: "Hit Die", value: String(data.hp_die) });

  const domainNames =
    theme?.domains ??
    (Array.isArray(data.domains) ? (data.domains as string[]) : []);

  const namePrefix = `${klass.name}: `;
  const stripName = (n: string) =>
    n.startsWith(namePrefix) ? n.slice(namePrefix.length) : n;

  const classOwnFeatures = features.filter((f) => f.classes?.includes(klass.name));
  const hopeFeatures = classOwnFeatures.filter(
    (f) => (f.data as Record<string, unknown>)?.feature_category === "hope_feature"
  );
  const classFeatures = classOwnFeatures.filter(
    (f) => (f.data as Record<string, unknown>)?.feature_category === "class_feature"
  );

  return (
    <div className="scrollbar-none flex h-full flex-col gap-3 overflow-y-auto rounded-lg border border-leather/40 bg-transparent p-3 pr-2 text-leather">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="size-6 text-leather" />}
        <h3 className="font-heading text-lg font-bold uppercase tracking-[0.12em] text-leather">
          {klass.name}
        </h3>
      </div>

      {domainNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {domainNames.map((d) => (
            <span
              key={d}
              className="rounded border border-leather/40 px-2 py-0.5 text-[11px] font-semibold uppercase text-leather"
            >
              {d}
            </span>
          ))}
        </div>
      )}

      {description && (
        <p className="whitespace-pre-line font-lore text-sm leading-snug text-leather/85">
          {description}
        </p>
      )}

      {stats.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded border border-leather/30 bg-transparent px-2 py-1 text-center"
            >
              <div className="text-[9px] font-heading font-semibold uppercase tracking-wider text-leather/70">
                {s.label}
              </div>
              <div className="font-mono text-sm text-leather">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {domainNames.length > 0 && (
        <DetailGroup label="Domains">
          {domainNames.map((d) => {
            const info = DAGGERHEART_DOMAINS[d];
            if (!info) return null;
            return (
              <DetailEntry
                key={d}
                name={`${d} — ${info.tagline}`}
                description={info.description}
              />
            );
          })}
        </DetailGroup>
      )}

      {hopeFeatures.length > 0 && (
        <DetailGroup label="Hope Feature">
          {hopeFeatures.map((f) => (
            <DetailEntry
              key={f.id}
              name={stripName(f.name)}
              description={f.description ?? ""}
            />
          ))}
        </DetailGroup>
      )}

      {classFeatures.length > 0 && (
        <DetailGroup label="Class Feature">
          {classFeatures.map((f) => (
            <DetailEntry
              key={f.id}
              name={stripName(f.name)}
              description={f.description ?? ""}
            />
          ))}
        </DetailGroup>
      )}
    </div>
  );
}

function DetailGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <h4 className="font-heading text-xs font-bold uppercase tracking-[0.14em] text-leather/85">
        {label}
      </h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DetailEntry({
  name,
  description,
}: {
  name: string;
  description: string;
}) {
  return (
    <div className="text-sm">
      <div className="font-heading font-bold text-leather">{name}</div>
      {description && (
        <p className="whitespace-pre-line font-lore text-leather/80 leading-snug">
          {description}
        </p>
      )}
    </div>
  );
}

function EmptyDetail({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center text-center text-sm italic text-leather/60">
      {message}
    </div>
  );
}

function ComingSoon({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
      <h2 className="font-heading text-xl font-bold uppercase tracking-[0.12em] text-leather">
        {title}
      </h2>
      <p className="font-lore text-sm font-medium text-leather/75">
        {subtitle}
      </p>
    </div>
  );
}
