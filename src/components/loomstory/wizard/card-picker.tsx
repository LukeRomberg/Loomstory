"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface PickerCard {
  id: string;
  title: string;
  description: string;
  badges?: { label: string; className?: string }[];
  stats?: { label: string; value: string }[];
  details?: { label: string; items: string[] }[];
  /** Feature groups with name + description (e.g. Foundation Feature, Specialization Features). */
  featureGroups?: {
    label: string;
    features: { name: string; description: string }[];
  }[];
  gradient?: string;
  borderColor?: string;
  textColor?: string;
  /** Optional Lucide icon rendered alongside the title in every card variant. */
  icon?: LucideIcon;
  /**
   * Optional public-URL path to a hero image (e.g. /ancestries/Faerie-f.png).
   * When present, rendered as the top portion of the card in both grid +
   * compact + expanded views.
   */
  heroImage?: string;
}

interface CardPickerProps {
  cards: PickerCard[];
  onSelect: (id: string) => void;
  selectedId?: string;
  loading?: boolean;
  columns?: 2 | 3 | 4;
  selectLabel?: string;
  /** When set, the picker becomes multi-select with this exact-N cap. */
  multi?: { count: number };
  /** Multi-mode: the currently-selected card ids. */
  selectedIds?: string[];
  /** Multi-mode: called with the full updated id array on add/remove. */
  onMultiChange?: (ids: string[]) => void;
}

export function CardPicker({
  cards,
  onSelect,
  selectedId,
  loading,
  columns = 4,
  selectLabel = "Choose",
  multi,
  selectedIds,
  onMultiChange,
}: CardPickerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex justify-center py-12" data-testid="card-picker-loading">
        <Loader2 className="size-8 text-gold animate-spin" />
      </div>
    );
  }

  const isMulti = !!multi;
  const picks = selectedIds ?? [];
  const atCap = isMulti && picks.length >= multi.count;
  const isPicked = (id: string) => picks.includes(id);
  const expandedCard = cards.find((c) => c.id === expandedId) ?? null;

  function toggleMulti(id: string) {
    if (!onMultiChange) return;
    if (isPicked(id)) {
      onMultiChange(picks.filter((p) => p !== id));
    } else if (!atCap) {
      onMultiChange([...picks, id]);
    }
  }

  // ─── Master-Detail Layout (when a card is expanded) ──────────
  if (expandedCard) {
    return (
      <div
        className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-4 flex-1 min-h-0"
        data-testid="card-picker-master-detail"
      >
        {/* Left: compact card list */}
        <div
          className="overflow-y-auto pr-2 space-y-2"
          data-testid="card-picker-list"
        >
          {cards.map((card) => (
            <CompactCard
              key={card.id}
              card={card}
              isSelected={isMulti ? isPicked(card.id) : selectedId === card.id}
              isExpanded={card.id === expandedId}
              onClick={() =>
                setExpandedId(card.id === expandedId ? null : card.id)
              }
            />
          ))}
        </div>

        {/* Right: expanded detail */}
        <div
          className="overflow-y-auto pl-2 animate-fade-in"
          data-testid="card-picker-detail"
        >
          <ExpandedCardContent
            card={expandedCard}
            selectLabel={selectLabel}
            onSelect={() => onSelect(expandedCard.id)}
            multi={
              isMulti
                ? {
                    picked: isPicked(expandedCard.id),
                    disabled: atCap && !isPicked(expandedCard.id),
                    onToggle: () => toggleMulti(expandedCard.id),
                  }
                : undefined
            }
          />
        </div>
      </div>
    );
  }

  // ─── Grid Layout (no card expanded) ──────────────────────────
  const gridCols =
    columns === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : columns === 3
        ? "grid-cols-1 sm:grid-cols-3"
        : "grid-cols-2 sm:grid-cols-4";

  return (
    <div
      className={cn(
        "grid gap-3 items-start overflow-y-auto pr-2 flex-1 min-h-0",
        gridCols
      )}
      data-testid="card-picker-grid"
    >
      {cards.map((card) => (
        <GridCard
          key={card.id}
          card={card}
          isSelected={isMulti ? isPicked(card.id) : selectedId === card.id}
          onClick={() => setExpandedId(card.id)}
        />
      ))}
    </div>
  );
}

// ─── GridCard (compact, used in full grid view) ───────────────

function GridCard({
  card,
  isSelected,
  onClick,
}: {
  card: PickerCard;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      data-card-id={card.id}
      data-selected={isSelected || undefined}
      onClick={onClick}
      className={cn(
        "rounded-xl border-2 text-left transition-all duration-300 cursor-pointer overflow-hidden",
        "bg-gradient-to-br hover:shadow-lg hover:shadow-black/50",
        card.gradient ?? "from-zinc-900 to-zinc-800",
        isSelected
          ? cn(card.borderColor ?? "border-gold/60", "ring-2 ring-gold/20")
          : "border-transparent hover:scale-[1.03]"
      )}
    >
      {card.heroImage && (
        <div className="relative w-full aspect-square bg-black/30">
          <Image
            src={card.heroImage}
            alt={card.title}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover object-top"
          />
        </div>
      )}
      <div className="p-4">
        <div
          className={cn(
            "font-heading mb-1 text-lg flex items-center gap-2",
            card.textColor ?? "text-gold"
          )}
        >
          {card.icon && <card.icon className="h-5 w-5 shrink-0" aria-hidden />}
          <span>{card.title}</span>
        </div>
        <p className="text-muted-foreground leading-snug font-lore text-sm line-clamp-2">
          {card.description}
        </p>
        {card.badges && card.badges.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {card.badges.map((badge) => (
              <span
                key={badge.label}
                className={cn(
                  "text-sm font-heading uppercase tracking-wider rounded px-1.5 py-0.5",
                  badge.className ??
                    "bg-black/30 text-muted-foreground border border-white/10"
                )}
              >
                {badge.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CompactCard (used in master-detail left list) ────────────

function CompactCard({
  card,
  isSelected,
  isExpanded,
  onClick,
}: {
  card: PickerCard;
  isSelected: boolean;
  isExpanded: boolean;
  onClick: () => void;
}) {
  return (
    <div
      data-card-id={card.id}
      data-selected={isSelected || undefined}
      data-expanded={isExpanded || undefined}
      onClick={onClick}
      className={cn(
        "rounded-lg border-2 p-3 text-left transition-all duration-200 cursor-pointer",
        "bg-gradient-to-br hover:brightness-110",
        card.gradient ?? "from-zinc-900 to-zinc-800",
        isExpanded
          ? cn(card.borderColor ?? "border-gold/60", "ring-2 ring-gold/30")
          : isSelected
            ? cn(card.borderColor ?? "border-gold/60", "ring-1 ring-gold/20")
            : "border-transparent"
      )}
    >
      <div className="flex items-start gap-3">
        {card.heroImage && (
          <div className="relative size-14 shrink-0 rounded-md overflow-hidden bg-black/30">
            <Image
              src={card.heroImage}
              alt={card.title}
              fill
              sizes="56px"
              className="object-cover object-top"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
      <div
        className={cn(
          "font-heading text-base flex items-center gap-2",
          card.textColor ?? "text-gold"
        )}
      >
        {card.icon && <card.icon className="h-4 w-4 shrink-0" aria-hidden />}
        <span>{card.title}</span>
      </div>
      <p className="text-muted-foreground leading-snug font-lore text-sm line-clamp-2 mt-0.5">
        {card.description}
      </p>
      {card.badges && card.badges.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {card.badges.slice(0, 3).map((badge) => (
            <span
              key={badge.label}
              className={cn(
                "text-xs font-heading uppercase tracking-wider rounded px-1.5 py-0.5",
                badge.className ??
                  "bg-black/30 text-muted-foreground border border-white/10"
              )}
            >
              {badge.label}
            </span>
          ))}
        </div>
      )}
        </div>
      </div>
    </div>
  );
}

// ─── ExpandedCardContent (right side of master-detail) ────────

function ExpandedCardContent({
  card,
  selectLabel,
  onSelect,
  multi,
}: {
  card: PickerCard;
  selectLabel: string;
  onSelect: () => void;
  multi?: { picked: boolean; disabled: boolean; onToggle: () => void };
}) {
  return (
    <div
      className={cn(
        "rounded-xl border-2 space-y-4 overflow-hidden",
        "bg-gradient-to-br",
        card.gradient ?? "from-zinc-900 to-zinc-800",
        card.borderColor ?? "border-gold/60"
      )}
    >
      {card.heroImage && (
        <div className="relative w-full aspect-[3/2] bg-black/30 -mt-px">
          <Image
            src={card.heroImage}
            alt={card.title}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover object-top"
            priority
          />
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 p-4 font-heading text-2xl",
              card.textColor ?? "text-gold",
              "bg-gradient-to-t from-black/80 via-black/40 to-transparent"
            )}
          >
            {card.title}
          </div>
        </div>
      )}
      <div className="p-6 pt-0 space-y-4">
      {/* Description (preserves \n\n paragraph breaks from heritage flavor text) */}
      <p className="text-muted-foreground leading-snug font-lore text-lg whitespace-pre-line">
        {card.description}
      </p>

      {/* Badges */}
      {card.badges && card.badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {card.badges.map((badge) => (
            <span
              key={badge.label}
              className={cn(
                "text-sm font-heading uppercase tracking-wider rounded px-2 py-0.5",
                badge.className ??
                  "bg-black/30 text-muted-foreground border border-white/10"
              )}
            >
              {badge.label}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      {card.stats && card.stats.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {card.stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded bg-black/30 px-3 py-2 text-center"
            >
              <div className="text-sm text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </div>
              <div
                className={cn(
                  "text-lg font-mono whitespace-nowrap",
                  card.textColor ?? "text-gold"
                )}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail sections */}
      {card.details?.map((detail) => (
        <div key={detail.label}>
          <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
            {detail.label}
          </div>
          <div className="flex flex-wrap gap-1">
            {detail.items.map((item) => (
              <span
                key={item}
                className="text-sm rounded px-1.5 py-0.5 bg-black/30 text-muted-foreground"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      ))}

      {/* Feature groups */}
      {card.featureGroups?.map((group) => (
        <div key={group.label}>
          <div className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
            {group.label}
          </div>
          <div className="space-y-2">
            {group.features.map((feature) => (
              <div
                key={feature.name}
                className="rounded bg-black/30 px-3 py-2.5"
              >
                <div
                  className={cn(
                    "text-lg font-heading mb-1",
                    card.textColor ?? "text-gold"
                  )}
                >
                  {feature.name}
                </div>
                <p className="text-base leading-snug font-lore text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Choose / Add / Remove button — multi mode toggles, single mode selects */}
      {multi ? (
        <button
          onClick={multi.onToggle}
          disabled={multi.disabled}
          className={cn(
            "w-full rounded-lg py-3 text-lg font-heading tracking-wider",
            "border transition-all duration-150",
            "bg-black/40 border-current",
            card.textColor ?? "text-gold",
            multi.disabled
              ? "opacity-40 cursor-not-allowed"
              : "cursor-pointer hover:brightness-110"
          )}
        >
          {multi.picked ? "Remove" : "Add"} {card.title}
        </button>
      ) : (
        <button
          onClick={onSelect}
          className={cn(
            "w-full rounded-lg py-3 text-lg font-heading tracking-wider",
            "border transition-all duration-150 cursor-pointer hover:brightness-110",
            "bg-black/40 border-current",
            card.textColor ?? "text-gold"
          )}
        >
          {selectLabel} {card.title}
        </button>
      )}
      </div>
    </div>
  );
}
