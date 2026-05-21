"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import Image from "next/image";
import {
  DAGGERHEART_ANCESTRY_ICONS,
  getAncestryImage,
} from "@/lib/character/configs/daggerheart-ancestry-icons";
import type {
  WizardState,
  CompendiumClass,
  CompendiumAbility,
  CompendiumItem,
  ClassTheme,
} from "@/lib/character/wizard-types";

// ─── Props ──────────────────────────────────────────────────

interface CharacterSheetPreviewProps {
  wizardState: WizardState;
  selectedClass: CompendiumClass | null;
  selectedSubclass: CompendiumClass | null;
  ancestryFeatures: CompendiumAbility[];
  communityFeatures: CompendiumAbility[];
  classFeatures: CompendiumAbility[];
  subclassFeatures: CompendiumAbility[];
  domainCards: CompendiumAbility[];
  primaryWeapon: CompendiumItem | null;
  secondaryWeapon: CompendiumItem | null;
  armor: CompendiumItem | null;
  potion: CompendiumItem | null;
  classTheme?: ClassTheme;
  onNameChange: (name: string) => void;
  onCreate: () => void;
  creating?: boolean;
}

// ─── Constants ──────────────────────────────────────────────

/** SRD step 5 starting inventory — every character gets these. */
const BASIC_SUPPLIES = [
  "Torch",
  "50 ft of Rope",
  "Basic Supplies",
  "Handful of Gold",
];

const TRAITS: ReadonlyArray<{ key: string; label: string }> = [
  { key: "agility", label: "Agility" },
  { key: "strength", label: "Strength" },
  { key: "finesse", label: "Finesse" },
  { key: "instinct", label: "Instinct" },
  { key: "presence", label: "Presence" },
  { key: "knowledge", label: "Knowledge" },
];

/** Default Hope pool for a new character: 2 filled out of 6 total. */
const STARTING_HOPE = 2;
const HOPE_MAX = 6;
const STRESS_MAX = 6;

/** Daggerheart purse: 10 Handfuls fill a Bag, 10 Bags fill the Chest. */
const HANDFULS_MAX = 10;
const BAGS_MAX = 10;
const STARTING_HANDFULS = 1;

// ─── Helpers ────────────────────────────────────────────────

function stripPrefix(name: string, prefix: string | null): string {
  if (!prefix) return name;
  const full = `${prefix}: `;
  return name.startsWith(full) ? name.slice(full.length) : name;
}

function formatModifier(value: number | undefined): string {
  if (value == null) return "—";
  if (value >= 0) return `+${value}`;
  return String(value);
}

function featureByCategory(
  features: CompendiumAbility[],
  category: string
): CompendiumAbility | undefined {
  return features.find(
    (f) => (f.data as Record<string, unknown>)?.feature_category === category
  );
}

function subclassFoundationFeature(
  features: CompendiumAbility[],
  subclassName: string | null
): CompendiumAbility | undefined {
  if (!subclassName) return undefined;
  return features.find((f) => {
    const data = f.data as Record<string, unknown>;
    return (
      data?.subclass === subclassName &&
      data?.feature_category === "foundation_feature"
    );
  });
}

// ─── Component ──────────────────────────────────────────────

export function CharacterSheetPreview({
  wizardState,
  selectedClass,
  selectedSubclass,
  ancestryFeatures,
  communityFeatures,
  classFeatures,
  subclassFeatures,
  domainCards,
  primaryWeapon,
  secondaryWeapon,
  armor,
  potion,
  classTheme,
  onNameChange,
  onCreate,
  creating,
}: CharacterSheetPreviewProps) {
  const classData = (selectedClass?.data ?? {}) as Record<string, unknown>;
  const evasion = (classData.evasion as number | undefined) ?? null;
  const hpSlots = (classData.hp_slots as number | undefined) ?? 6;
  const domains = (classData.domains as string[] | undefined) ?? [];

  const armorProps = (armor?.properties ?? {}) as Record<string, unknown>;
  const armorScore = armorProps.base_score as number | undefined;
  const armorThresholds = armorProps.thresholds as string | undefined;
  // Daggerheart prints thresholds as "Major / Severe". Parse for the band;
  // fall back to dashes when no armor is picked yet.
  const [majorThreshold, severeThreshold] = (() => {
    if (!armorThresholds) return [null, null];
    const parts = armorThresholds.split("/").map((p) => p.trim());
    return [parts[0] ?? null, parts[1] ?? null];
  })();

  const ClassIcon = classTheme?.icon;
  const ancestryName = wizardState.ancestryName;
  const ancestryImage = ancestryName
    ? getAncestryImage(ancestryName, wizardState.ancestryVariant)
    : null;
  const AncestryIcon = ancestryName
    ? DAGGERHEART_ANCESTRY_ICONS[ancestryName]
    : undefined;

  const hopeFeature = featureByCategory(classFeatures, "hope_feature");
  const classFeature = featureByCategory(classFeatures, "class_feature");
  const subclassFoundation = subclassFoundationFeature(
    subclassFeatures,
    wizardState.subclassName
  );

  const nonEmptyExperiences = (wizardState.experiences ?? []).filter(
    (e) => e.name.trim().length > 0
  );

  const nameValid = wizardState.name.trim().length > 0;
  const hasEquipment = !!(primaryWeapon || secondaryWeapon);

  return (
    <div className="space-y-5">
      {/* ─── BANNER ─────────────────────────────────────────── */}
      <div
        data-testid="preview-banner"
        className={cn(
          "rounded-lg border-2 bg-transparent p-4",
          classTheme?.borderColor ?? "border-leather/40"
        )}
      >
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {ClassIcon ? (
            <ClassIcon
              data-testid="preview-class-icon"
              className="size-8 shrink-0 text-leather"
              aria-hidden
            />
          ) : (
            <span data-testid="preview-class-icon" aria-hidden className="size-8" />
          )}
          <input
            type="text"
            value={wizardState.name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Name your hero…"
            aria-label="Character name"
            className="flex-1 max-w-xs bg-transparent border-b border-leather/40 focus:border-leather focus:outline-none text-center font-heading text-base text-leather px-2 py-0.5 placeholder:text-leather/40"
          />
          {ancestryImage && ancestryName ? (
            <Image
              data-testid="preview-ancestry-icon"
              src={ancestryImage}
              alt={`${ancestryName} ancestry portrait`}
              width={64}
              height={64}
              className="size-8 shrink-0 rounded-full object-cover ring-1 ring-leather/50"
              priority
            />
          ) : AncestryIcon ? (
            <AncestryIcon
              data-testid="preview-ancestry-icon"
              className="size-8 shrink-0 text-leather"
              aria-hidden
            />
          ) : (
            <span data-testid="preview-ancestry-icon" aria-hidden className="size-8" />
          )}
        </div>
        <div className="text-center mt-2 text-[10px] font-heading font-semibold tracking-wider text-leather/75 uppercase">
          {selectedClass && <span>{selectedClass.name}</span>}
          {ancestryName && <span> · {ancestryName}</span>}
          {wizardState.communityName && <span> · {wizardState.communityName}</span>}
          {domains.length > 0 && <span> · {domains.join(" & ")}</span>}
          {selectedSubclass && <span> · {selectedSubclass.name}</span>}
        </div>
      </div>

      {/* ─── TRAITS ─────────────────────────────────────────── */}
      <div data-testid="preview-traits">
        <div className="mb-1.5 text-[10px] font-heading font-bold uppercase tracking-[0.18em] text-leather">
          Traits
        </div>
        <div className="grid grid-cols-3 gap-2">
          {TRAITS.map(({ key, label }) => (
            <TraitTile
              key={key}
              label={label}
              value={wizardState.statValues[key]}
              theme={classTheme}
            />
          ))}
        </div>
      </div>

      {/* ─── COMBAT ─────────────────────────────────────────── */}
      <SectionCard title="Combat" testId="preview-combat" theme={classTheme}>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <StatTile
            label="Evasion"
            value={evasion != null ? String(evasion) : "—"}
            theme={classTheme}
          />
          <StatTile
            label="Armor"
            value={armorScore != null ? String(armorScore) : "—"}
            theme={classTheme}
          />
        </div>
        <DamageThresholdsBand
          major={majorThreshold}
          severe={severeThreshold}
        />
        <PipRow label="HP" count={hpSlots} testIdPrefix="hp-pip" />
        <PipRow label="Stress" count={STRESS_MAX} testIdPrefix="stress-pip" muted />
        <HopePipRow filled={STARTING_HOPE} max={HOPE_MAX} />
      </SectionCard>

      {/* ─── INVENTORY + GOLD (paired) ──────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SectionCard
          title="Inventory"
          testId="preview-inventory"
          theme={classTheme}
        >
          <ul className="space-y-0.5 text-xs">
            {BASIC_SUPPLIES.map((s) => (
              <li key={s} className="font-medium text-leather/85">
                · {s}
              </li>
            ))}
            {potion && (
              <li className="font-medium text-leather/85">· {potion.name}</li>
            )}
            {wizardState.classItemName && (
              <li className="font-medium text-leather/85">· {wizardState.classItemName}</li>
            )}
          </ul>
        </SectionCard>

        <SectionCard title="Gold" testId="preview-gold" theme={classTheme}>
          <GoldTracker startingHandfuls={STARTING_HANDFULS} />
        </SectionCard>
      </div>

      {/* ─── WEAPONS / ARMOR / FEATURES (full-width stack) ──── */}
      {hasEquipment && (
        <SectionCard
          title="Active Weapons"
          testId="preview-weapons"
          theme={classTheme}
        >
          <div className="flex items-baseline justify-between mb-2 text-[10px] font-semibold uppercase tracking-wider text-leather/70">
            <span>Proficiency</span>
            <span
              data-testid="proficiency-value"
              className="font-mono text-sm text-leather"
            >
              1
            </span>
          </div>
          {primaryWeapon && <WeaponRow weapon={primaryWeapon} label="Primary" />}
          {secondaryWeapon && (
            <WeaponRow weapon={secondaryWeapon} label="Secondary" />
          )}
        </SectionCard>
      )}

      {armor && (
        <SectionCard title="Active Armor" testId="preview-armor" theme={classTheme}>
          <div className="space-y-1">
            <div className="font-heading font-bold text-sm text-leather">
              {armor.name}
            </div>
            <div className="text-xs font-medium text-leather/75">
              Thresholds {armorThresholds ?? "—"} · Score {armorScore ?? "—"}
            </div>
          </div>
        </SectionCard>
      )}

      {hopeFeature && (
        <SectionCard title="Hope Feature" testId="preview-hope" theme={classTheme}>
          <FeatureBlock
            name={stripPrefix(hopeFeature.name, wizardState.className)}
            description={hopeFeature.description ?? ""}
            theme={classTheme}
          />
        </SectionCard>
      )}

      {classFeature && (
        <SectionCard title="Class Feature" theme={classTheme}>
          <FeatureBlock
            name={stripPrefix(classFeature.name, wizardState.className)}
            description={classFeature.description ?? ""}
            theme={classTheme}
          />
        </SectionCard>
      )}

      {subclassFoundation && (
        <SectionCard
          title="Subclass Feature"
          testId="preview-subclass-feature"
          theme={classTheme}
        >
          <FeatureBlock
            name={stripPrefix(subclassFoundation.name, wizardState.subclassName)}
            description={subclassFoundation.description ?? ""}
            theme={classTheme}
          />
        </SectionCard>
      )}

      {nonEmptyExperiences.length > 0 && (
        <SectionCard
          title="Experiences"
          testId="preview-experiences"
          theme={classTheme}
        >
          <ul className="space-y-1.5">
            {nonEmptyExperiences.map((exp, i) => (
              <li
                key={i}
                className="flex items-baseline justify-between gap-2 text-sm"
              >
                <span className="font-lore font-medium text-leather">{exp.name}</span>
                <span className="font-mono font-semibold text-leather">+2</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {/* ─── HERITAGE FEATURES ──────────────────────────────── */}
      {(ancestryFeatures.length > 0 || communityFeatures.length > 0) && (
        <SectionCard
          title="Heritage Features"
          testId="preview-heritage-features"
          theme={classTheme}
        >
          <div className="space-y-3">
            {ancestryFeatures.map((f) => (
              <FeatureBlock
                key={f.id}
                name={stripPrefix(f.name, wizardState.ancestryName)}
                description={f.description ?? ""}
                theme={classTheme}
              />
            ))}
            {communityFeatures.map((f) => (
              <FeatureBlock
                key={f.id}
                name={stripPrefix(f.name, wizardState.communityName)}
                description={f.description ?? ""}
                theme={classTheme}
              />
            ))}
          </div>
        </SectionCard>
      )}

      {/* ─── DOMAIN CARDS ───────────────────────────────────── */}
      {domainCards.length > 0 && (
        <SectionCard
          title="Domain Cards"
          testId="preview-domain-cards"
          theme={classTheme}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {domainCards.map((card) => (
              <DomainCardDisplay key={card.id} card={card} theme={classTheme} />
            ))}
          </div>
        </SectionCard>
      )}

      {/* ─── CTA ─────────────────────────────────────────────── */}
      <Button
        type="button"
        onClick={onCreate}
        disabled={!nameValid || creating}
        className="w-full border-2 border-leather/60 bg-transparent py-3 font-heading text-sm font-bold uppercase tracking-[0.18em] text-leather hover:bg-leather/10"
      >
        {creating ? (
          "Creating..."
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Sparkles className="size-4" aria-hidden />
            Start Your Adventure
            <Sparkles className="size-4" aria-hidden />
          </span>
        )}
      </Button>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────

function SectionCard({
  title,
  testId,
  theme,
  children,
}: {
  title: string;
  testId?: string;
  theme?: ClassTheme;
  children: React.ReactNode;
}) {
  return (
    <div
      data-testid={testId}
      className={cn(
        "rounded-lg border bg-transparent p-3",
        theme?.borderColor ?? "border-leather/40"
      )}
    >
      <div className="text-[10px] font-heading font-bold uppercase tracking-[0.18em] text-leather mb-2">
        {title}
      </div>
      {children}
    </div>
  );
}

function StatTile({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme?: ClassTheme;
}) {
  return (
    <div
      className={cn(
        "rounded border bg-transparent px-2 py-1.5 text-center",
        theme?.borderColor ?? "border-leather/30"
      )}
    >
      <div className="text-[9px] font-heading font-semibold uppercase tracking-wider text-leather/70">
        {label}
      </div>
      <div className="font-mono text-xl text-leather">{value}</div>
    </div>
  );
}

function PipRow({
  label,
  count,
  testIdPrefix,
  muted,
}: {
  label: string;
  count: number;
  testIdPrefix: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start gap-2 py-0.5">
      <span className="w-12 shrink-0 pt-0.5 text-[10px] font-heading font-semibold uppercase tracking-wider text-leather/70">
        {label}
      </span>
      <div className="flex min-w-0 flex-wrap gap-1">
        {Array.from({ length: count }).map((_, i) => (
          <span
            key={i}
            data-testid={`${testIdPrefix}-${i}`}
            className={cn(
              "size-3 rounded-sm border-2",
              muted ? "border-leather/40" : "border-leather/60"
            )}
          />
        ))}
      </div>
    </div>
  );
}

function TraitTile({
  label,
  value,
  theme,
}: {
  label: string;
  value: number | undefined;
  theme?: ClassTheme;
}) {
  return (
    <div
      className={cn(
        "rounded border bg-transparent px-1 py-1.5 text-center",
        theme?.borderColor ?? "border-leather/30"
      )}
    >
      <div className="text-[8px] font-heading font-semibold uppercase tracking-tight text-leather/70 mb-0.5 whitespace-nowrap">
        {label}
      </div>
      <div className="font-mono text-lg text-leather">
        {formatModifier(value)}
      </div>
    </div>
  );
}

function WeaponRow({
  weapon,
  label,
}: {
  weapon: CompendiumItem;
  label: "Primary" | "Secondary";
}) {
  const props = weapon.properties as Record<string, unknown>;
  const range = props.range as string | undefined;
  const damage = props.damage as string | undefined;
  return (
    <div className="mb-1.5 last:mb-0">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-leather/70">
        {label}
      </div>
      <div className="font-heading font-bold text-sm text-leather">{weapon.name}</div>
      <div className="text-xs text-leather/75 font-mono font-medium">
        {[damage, range].filter(Boolean).join(" · ")}
      </div>
    </div>
  );
}

function FeatureBlock({
  name,
  description,
  theme,
}: {
  name: string;
  description: string;
  theme?: ClassTheme;
}) {
  return (
    <div
      className={cn(
        "rounded border bg-transparent px-2 py-1.5",
        theme?.borderColor ?? "border-leather/25"
      )}
    >
      <div className="font-heading font-bold text-sm text-leather mb-0.5">
        {name}
      </div>
      <p className="text-xs leading-snug font-lore font-medium text-leather/80 whitespace-pre-line">
        {description}
      </p>
    </div>
  );
}

function HopePipRow({ filled, max }: { filled: number; max: number }) {
  return (
    <div className="flex items-start gap-2 py-0.5">
      <span className="w-12 shrink-0 pt-0.5 text-[10px] font-heading font-semibold uppercase tracking-wider text-leather/70">
        Hope
      </span>
      <div className="flex min-w-0 flex-wrap gap-1.5">
        {Array.from({ length: filled }).map((_, i) => (
          <span
            key={`hope-filled-${i}`}
            data-testid="hope-token-filled"
            className="size-3 rotate-45 bg-leather border-2 border-leather"
          />
        ))}
        {Array.from({ length: max - filled }).map((_, i) => (
          <span
            key={`hope-empty-${i}`}
            data-testid="hope-token-empty"
            className="size-3 rotate-45 border-2 border-leather/50"
          />
        ))}
      </div>
    </div>
  );
}

function DamageThresholdsBand({
  major,
  severe,
}: {
  major: string | null;
  severe: string | null;
}) {
  return (
    <div
      data-testid="preview-damage-thresholds"
      className="mb-2 flex items-center justify-center gap-3 text-[9px] font-heading font-semibold uppercase tracking-wider text-leather/70"
    >
      <span className="flex items-center gap-1.5">
        Major
        <span
          data-testid="threshold-major"
          className="rounded border border-leather/30 px-1.5 py-0.5 font-mono text-[10px] text-leather"
        >
          {major ?? "—"}
        </span>
      </span>
      <span className="flex items-center gap-1.5">
        Severe
        <span
          data-testid="threshold-severe"
          className="rounded border border-leather/30 px-1.5 py-0.5 font-mono text-[10px] text-leather"
        >
          {severe ?? "—"}
        </span>
      </span>
    </div>
  );
}

function GoldTracker({ startingHandfuls }: { startingHandfuls: number }) {
  return (
    <div className="space-y-1.5">
      <GoldRow label="Handfuls" max={HANDFULS_MAX} filled={startingHandfuls} />
      <GoldRow label="Bags" max={BAGS_MAX} filled={0} />
      <GoldRow label="Chest" max={1} filled={0} square />
    </div>
  );
}

function GoldRow({
  label,
  max,
  filled,
  square,
}: {
  label: string;
  max: number;
  filled: number;
  square?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-12 shrink-0 pt-0.5 text-[8px] font-heading font-semibold uppercase tracking-tight text-leather/70">
        {label}
      </span>
      <div className="flex min-w-0 flex-wrap gap-0.5">
        {Array.from({ length: max }).map((_, i) => (
          <span
            key={i}
            data-testid={`gold-${label.toLowerCase()}-pip-${i}`}
            className={cn(
              square ? "size-3" : "size-2",
              square ? "rounded-sm" : "rounded-full",
              "border",
              i < filled
                ? "bg-leather border-leather"
                : "border-leather/40"
            )}
          />
        ))}
      </div>
    </div>
  );
}

function DomainCardDisplay({
  card,
  theme,
}: {
  card: CompendiumAbility;
  theme?: ClassTheme;
}) {
  const data = card.data as Record<string, unknown>;
  const domain = data?.domain as string | undefined;
  return (
    <div
      className={cn(
        "rounded border bg-transparent p-2",
        theme?.borderColor ?? "border-leather/30"
      )}
    >
      <div className="flex items-baseline justify-between mb-1">
        <div className="font-heading font-bold text-sm text-leather">
          {card.name}
        </div>
        {domain && (
          <span className="text-[9px] font-semibold uppercase tracking-wider rounded border border-leather/30 px-1.5 py-0.5 text-leather/75">
            {domain}
          </span>
        )}
      </div>
      <p className="text-xs leading-snug font-lore font-medium text-leather/80">
        {card.description}
      </p>
    </div>
  );
}
