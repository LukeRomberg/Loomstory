"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface PickerCard {
  id: string;
  title: string;
  description: string;
  badges?: { label: string; className?: string }[];
  stats?: { label: string; value: string }[];
  details?: { label: string; items: string[] }[];
  gradient?: string;
  borderColor?: string;
  textColor?: string;
}

interface CardPickerProps {
  cards: PickerCard[];
  onSelect: (id: string) => void;
  selectedId?: string;
  loading?: boolean;
  columns?: 2 | 3 | 4;
  selectLabel?: string;
}

export function CardPicker({
  cards,
  onSelect,
  selectedId,
  loading,
  columns = 4,
  selectLabel = "Choose",
}: CardPickerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex justify-center py-12" data-testid="card-picker-loading">
        <Loader2 className="size-8 text-gold animate-spin" />
      </div>
    );
  }

  const gridCols =
    columns === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : columns === 3
        ? "grid-cols-1 sm:grid-cols-3"
        : "grid-cols-2 sm:grid-cols-4";

  return (
    <div className={cn("grid gap-3 items-start", gridCols)}>
      {cards.map((card) => {
        const isExpanded = expandedId === card.id;
        const isSelected = selectedId === card.id;

        return (
          <div
            key={card.id}
            data-card-id={card.id}
            data-selected={isSelected || undefined}
            onClick={() => setExpandedId(isExpanded ? null : card.id)}
            className={cn(
              "rounded-xl border-2 p-4 text-left transition-all duration-300 cursor-pointer",
              "bg-gradient-to-br hover:shadow-lg hover:shadow-black/50",
              card.gradient ?? "from-zinc-900 to-zinc-800",
              isExpanded
                ? cn(card.borderColor ?? "border-gold/60", "shadow-lg shadow-black/50 col-span-2")
                : isSelected
                  ? cn(card.borderColor ?? "border-gold/60", "ring-2 ring-gold/20")
                  : "border-transparent hover:scale-[1.03]"
            )}
          >
            {/* Header */}
            <div className={cn("flex gap-3", isExpanded ? "items-start" : "flex-col")}>
              <div className="min-w-0">
                <div
                  className={cn(
                    "font-heading mb-1",
                    isExpanded ? "text-base" : "text-sm",
                    card.textColor ?? "text-gold"
                  )}
                >
                  {card.title}
                </div>
                <p
                  className={cn(
                    "text-muted-foreground leading-snug font-lore",
                    isExpanded ? "text-xs" : "text-[10px] line-clamp-2"
                  )}
                >
                  {card.description}
                </p>
                {card.badges && card.badges.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {card.badges.map((badge) => (
                      <span
                        key={badge.label}
                        className={cn(
                          "text-[9px] font-heading uppercase tracking-wider rounded px-1.5 py-0.5",
                          badge.className ?? "bg-black/30 text-muted-foreground border border-white/10"
                        )}
                      >
                        {badge.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Expanded detail */}
            {isExpanded && (
              <div
                className="mt-4 animate-fade-in space-y-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="border-t border-white/10 pt-4 space-y-3">
                  {/* Stats */}
                  {card.stats && card.stats.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {card.stats.map((stat) => (
                        <div key={stat.label} className="rounded bg-black/30 px-2.5 py-1.5 text-center">
                          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">
                            {stat.label}
                          </div>
                          <div className={cn("text-xs font-mono whitespace-nowrap", card.textColor ?? "text-gold")}>
                            {stat.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Detail sections */}
                  {card.details?.map((detail) => (
                    <div key={detail.label}>
                      <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">
                        {detail.label}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {detail.items.map((item) => (
                          <span
                            key={item}
                            className="text-[10px] rounded px-1.5 py-0.5 bg-black/30 text-muted-foreground"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => onSelect(card.id)}
                  className={cn(
                    "w-full rounded-lg py-2 text-xs font-heading tracking-wider",
                    "border transition-all duration-150 hover:brightness-110",
                    "bg-black/40 border-current",
                    card.textColor ?? "text-gold"
                  )}
                >
                  {selectLabel} {card.title}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
