"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import Image from "next/image";
import {
  DAGGERHEART_ANCESTRY_ICONS,
  DAGGERHEART_ANCESTRY_IMAGES,
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

/**
 * Build the auto-generated tagline shown under the BEHOLD banner.
 * Article ("a" vs "an") matches the ancestry's leading sound.
 */
function buildTagline(
  ancestry: string | null,
  cls: string | null,
  community: string | null
): string {
  if (!ancestry || !cls) return "";
  const article = /^[aeiouAEIOU]/.test(ancestry) ? "an" : "a";
  return community
    ? `${article} ${ancestry} ${cls} of the ${community}`
    : `${article} ${ancestry} ${cls}`;
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

  const ClassIcon = classTheme?.icon;
  const ancestryName = wizardState.ancestryName;
  const ancestryImage = ancestryName ? DAGGERHEART_ANCESTRY_IMAGES[ancestryName] : undefined;
  const AncestryIcon = ancestryName
    ? DAGGERHEART_ANCESTRY_ICONS[ancestryName]
    : undefined;

  const tagline = buildTagline(
    wizardState.ancestryName,
    wizardState.className,
    wizardState.communityName
  );

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
          "rounded-2xl border-2 p-8 bg-gradient-to-br",
          classTheme?.gradient ?? "from-zinc-900 to-zinc-800",
          classTheme?.borderColor ?? "border-gold/60"
        )}
      >
        <div className="text-center mb-4 text-xs font-heading tracking-[0.4em] text-gold/80 uppercase">
          ✨ Behold ✨
        </div>
        <div className="flex items-center justify-center gap-6 mb-4 flex-wrap">
          {ClassIcon ? (
            <ClassIcon
              data-testid="preview-class-icon"
              className={cn("size-14 shrink-0", classTheme?.textColor ?? "text-gold")}
              aria-hidden
            />
          ) : (
            <span data-testid="preview-class-icon" aria-hidden className="size-14" />
          )}
          <input
            type="text"
            value={wizardState.name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Name your hero!"
            aria-label="Character name"
            className={cn(
              "bg-transparent border-b-2 border-gold/50 focus:border-gold focus:outline-none",
              "text-center font-heading text-3xl text-foreground px-4 py-2",
              "w-full max-w-md placeholder:text-muted-foreground/50"
            )}
          />
          {ancestryImage && ancestryName ? (
            <Image
              data-testid="preview-ancestry-icon"
              src={ancestryImage}
              alt={`${ancestryName} ancestry portrait`}
              width={112}
              height={112}
              className="size-14 shrink-0 rounded-full object-cover ring-2 ring-current"
              priority
            />
          ) : AncestryIcon ? (
            <AncestryIcon
              data-testid="preview-ancestry-icon"
              className={cn("size-14 shrink-0", classTheme?.textColor ?? "text-gold")}
              aria-hidden
            />
          ) : (
            <span data-testid="preview-ancestry-icon" aria-hidden className="size-14" />
          )}
        </div>
        {tagline && (
          <p className="text-center text-lg font-lore italic text-muted-foreground">
            {tagline}
          </p>
        )}
        <div className="text-center mt-3 text-xs font-heading tracking-wider text-muted-foreground/80 uppercase">
          {selectedClass && <span>{selectedClass.name}</span>}
          {domains.length > 0 && <span> · {domains.join(" & ")}</span>}
          {selectedSubclass && <span> · {selectedSubclass.name}</span>}
        </div>
      </div>

      {/* ─── BODY GRID ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-4">
        {/* ── LEFT COLUMN ──────────────────────────────────── */}
        <div className="space-y-4">
          <SectionCard title="Combat" testId="preview-combat" theme={classTheme}>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <StatTile label="Evasion" value={evasion != null ? String(evasion) : "—"} />
              <StatTile label="Armor" value={armorScore != null ? String(armorScore) : "—"} />
            </div>
            <PipRow label="HP" count={hpSlots} testIdPrefix="hp-pip" />
            <PipRow label="Stress" count={STRESS_MAX} testIdPrefix="stress-pip" muted />
          </SectionCard>

          <SectionCard title="Hope" testId="preview-hope" theme={classTheme}>
            <div className="flex gap-2 mb-3">
              {Array.from({ length: STARTING_HOPE }).map((_, i) => (
                <span
                  key={`filled-${i}`}
                  data-testid="hope-token-filled"
                  className="size-4 rotate-45 bg-gold border-2 border-gold"
                />
              ))}
              {Array.from({ length: HOPE_MAX - STARTING_HOPE }).map((_, i) => (
                <span
                  key={`empty-${i}`}
                  data-testid="hope-token-empty"
                  className="size-4 rotate-45 border-2 border-gold/60"
                />
              ))}
            </div>
            {hopeFeature && (
              <FeatureBlock
                name={stripPrefix(hopeFeature.name, wizardState.className)}
                description={hopeFeature.description ?? ""}
                theme={classTheme}
              />
            )}
          </SectionCard>

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
                    <span className="font-lore">{exp.name}</span>
                    <span className="font-mono text-gold">+2</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
        </div>

        {/* ── RIGHT COLUMN ─────────────────────────────────── */}
        <div className="space-y-4">
          <SectionCard title="Traits" testId="preview-traits" theme={classTheme}>
            <div className="grid grid-cols-3 gap-3">
              {TRAITS.map(({ key, label }) => (
                <TraitTile
                  key={key}
                  label={label}
                  value={wizardState.statValues[key]}
                  theme={classTheme}
                />
              ))}
            </div>
          </SectionCard>

          {hasEquipment && (
            <SectionCard
              title="Active Weapons"
              testId="preview-weapons"
              theme={classTheme}
            >
              <div className="flex items-baseline justify-between mb-3 text-xs uppercase tracking-wider text-muted-foreground">
                <span>Proficiency</span>
                <span
                  data-testid="proficiency-value"
                  className="font-mono text-base text-gold"
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
            <SectionCard
              title="Active Armor"
              testId="preview-armor"
              theme={classTheme}
            >
              <div className="space-y-1">
                <div className="font-heading text-base text-foreground">
                  {armor.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  Thresholds {armorThresholds ?? "—"} · Score {armorScore ?? "—"}
                </div>
              </div>
            </SectionCard>
          )}

          <SectionCard
            title="Inventory"
            testId="preview-inventory"
            theme={classTheme}
          >
            <ul className="space-y-1 text-sm">
              {BASIC_SUPPLIES.map((s) => (
                <li key={s} className="text-muted-foreground">
                  · {s}
                </li>
              ))}
              {potion && (
                <li className="text-muted-foreground">· {potion.name}</li>
              )}
              {wizardState.classItemName && (
                <li className="text-muted-foreground">· {wizardState.classItemName}</li>
              )}
            </ul>
          </SectionCard>
        </div>
      </div>

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
        className={cn(
          "w-full py-7 text-xl font-heading tracking-wider gold-glow",
          "bg-gradient-to-br border-2",
          classTheme?.gradient ?? "from-zinc-900 to-zinc-800",
          classTheme?.borderColor ?? "border-gold"
        )}
      >
        {creating ? (
          "Creating..."
        ) : (
          <span className="flex items-center justify-center gap-3">
            <Sparkles className="size-5" aria-hidden />
            Start Your Adventure!
            <Sparkles className="size-5" aria-hidden />
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
        "rounded-xl border-2 bg-card/40 p-4",
        theme?.borderColor ? `${theme.borderColor}/30` : "border-rune/40"
      )}
    >
      <div
        className={cn(
          "text-xs font-heading uppercase tracking-[0.25em] mb-3",
          theme?.textColor ?? "text-gold"
        )}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-black/30 px-3 py-2 text-center">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="font-mono text-2xl text-gold">{value}</div>
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
    <div className="flex items-center gap-2 py-1">
      <span className="text-[10px] font-heading uppercase tracking-wider text-muted-foreground w-12">
        {label}
      </span>
      <div className="flex gap-1">
        {Array.from({ length: count }).map((_, i) => (
          <span
            key={i}
            data-testid={`${testIdPrefix}-${i}`}
            className={cn(
              "size-4 rounded-sm border-2",
              muted ? "border-gold/40" : "border-gold/70"
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
        "rounded-lg border-2 bg-black/30 px-2 py-2 text-center",
        theme?.borderColor ? `${theme.borderColor}/40` : "border-rune/40"
      )}
    >
      <div className="text-[9px] font-heading uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </div>
      <div
        className={cn(
          "font-mono text-xl",
          theme?.textColor ?? "text-gold"
        )}
      >
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
    <div className="mb-2 last:mb-0">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="font-heading text-base text-foreground">{weapon.name}</div>
      <div className="text-xs text-muted-foreground font-mono">
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
    <div className="rounded-md bg-black/20 px-3 py-2">
      <div
        className={cn(
          "font-heading text-base mb-1",
          theme?.textColor ?? "text-gold"
        )}
      >
        {name}
      </div>
      <p className="text-sm leading-snug font-lore text-muted-foreground whitespace-pre-line">
        {description}
      </p>
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
        "rounded-lg border-2 bg-black/30 p-3",
        theme?.borderColor ? `${theme.borderColor}/40` : "border-rune/40"
      )}
    >
      <div className="flex items-baseline justify-between mb-1.5">
        <div
          className={cn(
            "font-heading text-base",
            theme?.textColor ?? "text-gold"
          )}
        >
          {card.name}
        </div>
        {domain && (
          <span className="text-[9px] uppercase tracking-wider rounded px-1.5 py-0.5 bg-black/40 text-muted-foreground">
            {domain}
          </span>
        )}
      </div>
      <p className="text-sm leading-snug font-lore text-muted-foreground">
        {card.description}
      </p>
    </div>
  );
}
