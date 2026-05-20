"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import { cn } from "@/lib/utils";
import { CharacterCreationShell } from "./character-creation-shell";
import { CharacterSheetPreview } from "./character-sheet-preview";
import { WizardProgress } from "./wizard-progress";
import { Button } from "@/components/ui/button";
import { useStepData } from "@/lib/character/use-step-data";
import { getVisibleSteps } from "@/lib/character/wizard-registry";
import { DAGGERHEART_DOMAINS } from "@/lib/character/configs/daggerheart-wizard";
import { getAncestryImage } from "@/lib/character/configs/daggerheart-ancestry-icons";
import type {
  WizardConfig,
  WizardState,
  WizardStepConfig,
  CompendiumClass,
  CompendiumAbility,
  ClassTheme,
} from "@/lib/character/wizard-types";
import { createEmptyWizardState } from "@/lib/character/wizard-types";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Synthetic step config for fetching subclass features for the picked class.
// Mirrors the old wizard's pattern — subclass_feature rows tag the parent class
// in `classes[]`, so we filter via `.contains()`.
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

  // ─── Subclass step data ─────────────────────────────────────
  const subclassStep = wizardConfig.steps["subclass_pick"];
  const { data: subclassData, loading: subclassesLoading } = useStepData(
    subclassStep,
    systemId,
    wizardState.classId
  );
  const subclasses = subclassData as unknown as CompendiumClass[];
  const selectedSubclass =
    subclasses.find((c) => c.id === wizardState.subclassId) ?? null;

  const { data: subclassFeaturesRaw } = useStepData(
    SUBCLASS_FEATURES_STEP_CONFIG,
    systemId,
    wizardState.className
  );
  const subclassFeatures = subclassFeaturesRaw as unknown as CompendiumAbility[];
  // Foundation feature only — what the sheet preview shows at level 1.
  const selectedSubclassFoundationFeatures = subclassFeatures.filter((f) => {
    const data = f.data as Record<string, unknown>;
    return (
      data?.subclass === wizardState.subclassName &&
      data?.feature_category === "foundation_feature"
    );
  });

  // ─── Ancestry step data ─────────────────────────────────────
  const ancestryStep = wizardConfig.steps["ancestry_pick"];
  const { data: ancestryDataRaw, loading: ancestryLoading } = useStepData(
    ancestryStep,
    systemId
  );
  const ancestryFeatures = ancestryDataRaw as unknown as CompendiumAbility[];
  const ancestryNames = uniqueDataValues(ancestryFeatures, "ancestry");
  const selectedAncestryFeatures = ancestryFeatures.filter(
    (f) => (f.data as Record<string, unknown>)?.ancestry === wizardState.ancestryName
  );

  // ─── Community step data ────────────────────────────────────
  const communityStep = wizardConfig.steps["community_pick"];
  const { data: communityDataRaw, loading: communityLoading } = useStepData(
    communityStep,
    systemId
  );
  const communityFeatures = communityDataRaw as unknown as CompendiumAbility[];
  const communityNames = uniqueDataValues(communityFeatures, "community");
  const selectedCommunityFeatures = communityFeatures.filter(
    (f) => (f.data as Record<string, unknown>)?.community === wizardState.communityName
  );

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
    if (currentStepKey === "subclass_pick") return wizardState.subclassId !== null;
    if (currentStepKey === "ancestry_pick") return wizardState.ancestryName !== null;
    if (currentStepKey === "community_pick") return wizardState.communityName !== null;
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
        classThemes={wizardConfig.classThemes}
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
  } else if (currentStepKey === "subclass_pick") {
    leftPage = (
      <SubclassListPicker
        subclasses={subclasses}
        loading={subclassesLoading}
        selectedId={wizardState.subclassId}
        onSelect={(id) => {
          const sub = subclasses.find((s) => s.id === id);
          setWizardState((prev) => ({
            ...prev,
            subclassId: id,
            subclassName: sub?.name ?? null,
          }));
        }}
        title={currentStep?.label ?? "Subclass"}
        subtitle={currentStep?.subtitle ?? null}
      />
    );
    rightPage = selectedSubclass ? (
      <SubclassDetailPanel
        subclass={selectedSubclass}
        features={subclassFeatures.filter(
          (f) =>
            (f.data as Record<string, unknown>)?.subclass === selectedSubclass.name
        )}
      />
    ) : (
      <EmptyDetail message="Pick a subclass to see its details." />
    );
  } else if (currentStepKey === "ancestry_pick") {
    leftPage = (
      <AncestryListPicker
        ancestries={ancestryNames}
        loading={ancestryLoading}
        variant={wizardState.ancestryVariant}
        onVariantChange={(v) =>
          setWizardState((prev) => ({ ...prev, ancestryVariant: v }))
        }
        selectedName={wizardState.ancestryName}
        onSelect={(name) =>
          setWizardState((prev) => ({ ...prev, ancestryName: name }))
        }
        title={currentStep?.label ?? "Ancestry"}
        subtitle={currentStep?.subtitle ?? null}
      />
    );
    rightPage = wizardState.ancestryName ? (
      <AncestryDetailPanel
        name={wizardState.ancestryName}
        variant={wizardState.ancestryVariant}
        features={selectedAncestryFeatures}
      />
    ) : (
      <EmptyDetail message="Pick an ancestry to see its details." />
    );
  } else if (currentStepKey === "community_pick") {
    leftPage = (
      <CommunityListPicker
        communities={communityNames}
        loading={communityLoading}
        selectedName={wizardState.communityName}
        onSelect={(name) =>
          setWizardState((prev) => ({ ...prev, communityName: name }))
        }
        title={currentStep?.label ?? "Community"}
        subtitle={currentStep?.subtitle ?? null}
      />
    );
    rightPage = wizardState.communityName ? (
      <CommunityDetailPanel
        name={wizardState.communityName}
        features={selectedCommunityFeatures}
      />
    ) : (
      <EmptyDetail message="Pick a community to see its details." />
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
          selectedSubclass={selectedSubclass}
          ancestryFeatures={selectedAncestryFeatures}
          communityFeatures={selectedCommunityFeatures}
          classFeatures={selectedClassFeatures}
          subclassFeatures={selectedSubclassFoundationFeatures}
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
  classThemes,
  onSelect,
  title,
  subtitle,
}: {
  classes: CompendiumClass[];
  loading: boolean;
  selectedId: string | null;
  classThemes?: Record<string, ClassTheme>;
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
          classes.map((c) => {
            const theme = classThemes?.[c.name];
            const isSelected = selectedId === c.id;
            return (
              <button
                key={c.id}
                aria-label={`Choose ${c.name}`}
                onClick={() => onSelect(c.id)}
                className={cn(
                  "w-full rounded border-2 px-3 py-2 text-left font-heading text-sm transition",
                  isSelected
                    ? cn(
                        "bg-leather/10 font-bold text-leather",
                        theme?.borderColor ?? "border-leather/50"
                      )
                    : "border-leather/15 text-leather/85 hover:bg-leather/5 hover:text-leather"
                )}
              >
                {c.name}
              </button>
            );
          })
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
    <div
      className={cn(
        "scrollbar-none flex h-full flex-col gap-3 overflow-y-auto rounded-lg border-2 bg-transparent p-3 pr-2 text-leather",
        theme?.borderColor ?? "border-leather/40"
      )}
    >
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
              className={cn(
                "rounded border px-2 py-0.5 text-[11px] font-semibold uppercase text-leather",
                theme?.borderColor ?? "border-leather/40"
              )}
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

// ─── Helpers ────────────────────────────────────────────────

/**
 * Collapses a list of ability rows down to the distinct values of `data[key]`.
 * Used to derive ancestry / community options from the per-feature rows in
 * compendium_abilities.
 */
function uniqueDataValues(
  features: CompendiumAbility[],
  key: string
): string[] {
  const out = new Set<string>();
  for (const f of features) {
    const v = (f.data as Record<string, unknown>)?.[key];
    if (typeof v === "string" && v.length > 0) out.add(v);
  }
  return Array.from(out).sort();
}

// ─── Subclass step ──────────────────────────────────────────

function SubclassListPicker({
  subclasses,
  loading,
  selectedId,
  onSelect,
  title,
  subtitle,
}: {
  subclasses: CompendiumClass[];
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
          <p className="text-sm italic text-leather/60">Loading subclasses…</p>
        ) : subclasses.length === 0 ? (
          <p className="text-sm italic text-leather/60">No subclasses available.</p>
        ) : (
          subclasses.map((s) => {
            const isSelected = selectedId === s.id;
            return (
              <button
                key={s.id}
                aria-label={`Choose ${s.name}`}
                onClick={() => onSelect(s.id)}
                className={cn(
                  "w-full rounded border-2 px-3 py-2 text-left font-heading text-sm transition",
                  isSelected
                    ? "border-leather/50 bg-leather/10 font-bold text-leather"
                    : "border-leather/15 text-leather/85 hover:bg-leather/5 hover:text-leather"
                )}
              >
                {s.name}
              </button>
            );
          })
        )}
      </div>
    </>
  );
}

function SubclassDetailPanel({
  subclass,
  features,
}: {
  subclass: CompendiumClass;
  features: CompendiumAbility[];
}) {
  const data = subclass.data as Record<string, unknown>;
  const description = (data.description as string) ?? "";

  const namePrefix = `${subclass.name}: `;
  const stripName = (n: string) =>
    n.startsWith(namePrefix) ? n.slice(namePrefix.length) : n;

  const buckets: Array<{ label: string; category: string }> = [
    { label: "Foundation Feature", category: "foundation_feature" },
    { label: "Specialization Features", category: "specialization_feature" },
    { label: "Mastery Features", category: "mastery_feature" },
  ];

  return (
    <div className="scrollbar-none flex h-full flex-col gap-3 overflow-y-auto rounded-lg border-2 border-leather/40 bg-transparent p-3 pr-2 text-leather">
      <h3 className="font-heading text-lg font-bold uppercase tracking-[0.12em] text-leather">
        {subclass.name}
      </h3>
      {description && (
        <p className="whitespace-pre-line font-lore text-sm leading-snug text-leather/85">
          {description}
        </p>
      )}
      {buckets.map((b) => {
        const rows = features.filter(
          (f) =>
            (f.data as Record<string, unknown>)?.feature_category === b.category
        );
        if (rows.length === 0) return null;
        return (
          <DetailGroup key={b.category} label={b.label}>
            {rows.map((f) => (
              <DetailEntry
                key={f.id}
                name={stripName(f.name)}
                description={f.description ?? ""}
              />
            ))}
          </DetailGroup>
        );
      })}
    </div>
  );
}

// ─── Ancestry step ──────────────────────────────────────────

function AncestryListPicker({
  ancestries,
  loading,
  variant,
  onVariantChange,
  selectedName,
  onSelect,
  title,
  subtitle,
}: {
  ancestries: string[];
  loading: boolean;
  variant: "female" | "male";
  onVariantChange: (v: "female" | "male") => void;
  selectedName: string | null;
  onSelect: (name: string) => void;
  title: string;
  subtitle: string | null;
}) {
  return (
    <>
      <div className="shrink-0">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-xl font-bold uppercase tracking-[0.12em] text-leather">
            {title}
          </h2>
          <div
            role="radiogroup"
            aria-label="Ancestry portrait variant"
            className="flex items-center gap-1 rounded-full border border-leather/30 bg-parchment/40 p-0.5"
          >
            {(["female", "male"] as const).map((v) => {
              const active = variant === v;
              return (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={v === "female" ? "Female" : "Male"}
                  onClick={() => onVariantChange(v)}
                  className={cn(
                    "rounded-full px-3 py-0.5 font-subheading text-[10px] uppercase tracking-[0.16em] transition",
                    active
                      ? "bg-leather text-gold"
                      : "text-leather/70 hover:text-leather"
                  )}
                >
                  {v === "female" ? "Female" : "Male"}
                </button>
              );
            })}
          </div>
        </div>
        {subtitle && (
          <p className="mt-1 font-lore text-sm font-medium text-leather/75">
            {subtitle}
          </p>
        )}
      </div>
      <div className="scrollbar-none mt-3 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {loading ? (
          <p className="text-sm italic text-leather/60">Loading ancestries…</p>
        ) : ancestries.length === 0 ? (
          <p className="text-sm italic text-leather/60">No ancestries available.</p>
        ) : (
          ancestries.map((name) => {
            const isSelected = selectedName === name;
            const portrait = getAncestryImage(name, variant);
            return (
              <button
                key={name}
                aria-label={`Choose ${name}`}
                onClick={() => onSelect(name)}
                className={cn(
                  "flex w-full items-center gap-2 rounded border-2 px-2 py-1.5 text-left font-heading text-sm transition",
                  isSelected
                    ? "border-leather/50 bg-leather/10 font-bold text-leather"
                    : "border-leather/15 text-leather/85 hover:bg-leather/5 hover:text-leather"
                )}
              >
                {portrait && (
                  <span className="relative inline-block size-8 shrink-0 overflow-hidden rounded-full border border-leather/30 bg-parchment/40">
                    <Image
                      src={portrait}
                      alt=""
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  </span>
                )}
                <span>{name}</span>
              </button>
            );
          })
        )}
      </div>
    </>
  );
}

function AncestryDetailPanel({
  name,
  variant,
  features,
}: {
  name: string;
  variant: "female" | "male";
  features: CompendiumAbility[];
}) {
  const flavor =
    features
      .map((f) => (f.data as Record<string, unknown>)?.flavor as string | undefined)
      .find((v) => typeof v === "string" && v.length > 0) ?? "";

  const portrait = getAncestryImage(name, variant);

  const namePrefix = `${name}: `;
  const stripName = (n: string) =>
    n.startsWith(namePrefix) ? n.slice(namePrefix.length) : n;

  return (
    <div
      data-testid="ancestry-detail"
      className="scrollbar-none flex h-full flex-col gap-3 overflow-y-auto rounded-lg border-2 border-leather/40 bg-transparent p-3 pr-2 text-leather"
    >
      <h3 className="font-heading text-lg font-bold uppercase tracking-[0.12em] text-leather">
        {name}
      </h3>
      {(portrait || flavor) && (
        <div className="overflow-hidden">
          {portrait && (
            <span className="relative float-left mr-3 mb-2 block aspect-square w-1/2 overflow-hidden rounded-md border border-leather/30 bg-parchment/40">
              <Image
                src={portrait}
                alt=""
                fill
                sizes="50vw"
                className="object-cover"
              />
            </span>
          )}
          {flavor && (
            <p className="whitespace-pre-line font-lore text-sm leading-snug text-leather/85">
              {flavor}
            </p>
          )}
        </div>
      )}
      {features.length > 0 && (
        <DetailGroup label="Ancestry Features">
          {features.map((f) => (
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

// ─── Community step ─────────────────────────────────────────

function CommunityListPicker({
  communities,
  loading,
  selectedName,
  onSelect,
  title,
  subtitle,
}: {
  communities: string[];
  loading: boolean;
  selectedName: string | null;
  onSelect: (name: string) => void;
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
          <p className="text-sm italic text-leather/60">Loading communities…</p>
        ) : communities.length === 0 ? (
          <p className="text-sm italic text-leather/60">No communities available.</p>
        ) : (
          communities.map((name) => {
            const isSelected = selectedName === name;
            return (
              <button
                key={name}
                aria-label={`Choose ${name}`}
                onClick={() => onSelect(name)}
                className={cn(
                  "w-full rounded border-2 px-3 py-2 text-left font-heading text-sm transition",
                  isSelected
                    ? "border-leather/50 bg-leather/10 font-bold text-leather"
                    : "border-leather/15 text-leather/85 hover:bg-leather/5 hover:text-leather"
                )}
              >
                {name}
              </button>
            );
          })
        )}
      </div>
    </>
  );
}

function CommunityDetailPanel({
  name,
  features,
}: {
  name: string;
  features: CompendiumAbility[];
}) {
  const flavor =
    features
      .map((f) => (f.data as Record<string, unknown>)?.flavor as string | undefined)
      .find((v) => typeof v === "string" && v.length > 0) ?? "";

  const adjectives = features
    .map((f) => (f.data as Record<string, unknown>)?.adjectives as unknown)
    .find((v): v is string[] => Array.isArray(v) && v.length > 0);

  const namePrefix = `${name}: `;
  const stripName = (n: string) =>
    n.startsWith(namePrefix) ? n.slice(namePrefix.length) : n;

  return (
    <div className="scrollbar-none flex h-full flex-col gap-3 overflow-y-auto rounded-lg border-2 border-leather/40 bg-transparent p-3 pr-2 text-leather">
      <h3 className="font-heading text-lg font-bold uppercase tracking-[0.12em] text-leather">
        {name}
      </h3>
      {flavor && (
        <p className="whitespace-pre-line font-lore text-sm leading-snug text-leather/85">
          {flavor}
        </p>
      )}
      {adjectives && adjectives.length > 0 && (
        <DetailGroup label="Personality">
          <p className="font-lore text-sm leading-snug text-leather/80">
            {adjectives.join(" · ")}
          </p>
        </DetailGroup>
      )}
      {features.length > 0 && (
        <DetailGroup label="Community Feature">
          {features.map((f) => (
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
