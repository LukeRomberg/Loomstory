"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface ExperienceSuggestionGroup {
  label: string;
  items: readonly string[];
}

interface ExperienceInputProps {
  count: number;
  /** Optional modifier badge rendered next to each input (e.g. "+2"). */
  modifier?: number;
  experiences: { name: string }[];
  suggestions: ReadonlyArray<ExperienceSuggestionGroup>;
  onChange: (experiences: { name: string }[]) => void;
}

export function ExperienceInput({
  count,
  modifier,
  experiences,
  suggestions,
  onChange,
}: ExperienceInputProps) {
  // Track the most-recently-focused input index. We never clear this on blur —
  // clicking a chip steals focus, and we want the chip click to land in the
  // input the player was just in, not lose track of it.
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);

  function updateAt(idx: number, value: string) {
    const next = experiences.map((e, i) => (i === idx ? { name: value } : e));
    onChange(next);
  }

  function handleChipClick(text: string) {
    let target = focusedIdx;
    if (target == null) {
      const firstEmpty = experiences.findIndex((e) => e.name.length === 0);
      target = firstEmpty >= 0 ? firstEmpty : 0;
    }
    updateAt(target, text);
  }

  const indices = Array.from({ length: count }, (_, i) => i);
  const modifierLabel =
    modifier != null ? (modifier >= 0 ? `+${modifier}` : String(modifier)) : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {indices.map((idx) => (
          <div key={idx} className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Experience {idx + 1}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                value={experiences[idx]?.name ?? ""}
                onChange={(e) => updateAt(idx, e.target.value)}
                onFocus={() => setFocusedIdx(idx)}
                placeholder="e.g. World Traveler"
                className="flex-1"
              />
              {modifierLabel && (
                <span className="text-sm font-mono text-gold/80 min-w-[2.25rem] text-center">
                  {modifierLabel}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="text-[10px] font-heading uppercase tracking-wider text-muted-foreground">
          Need inspiration? Tap a chip to drop it into your most recently selected input.
        </div>
        {suggestions.map((group) => (
          <div
            key={group.label}
            data-testid={`experience-suggestions-${group.label}`}
            className="space-y-1.5"
          >
            <div className="text-[10px] font-heading uppercase tracking-wider text-gold/70">
              {group.label}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {group.items.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleChipClick(item)}
                  className={cn(
                    "text-[11px] rounded px-2.5 py-1 border transition-colors",
                    "border-rune/60 bg-black/30 text-muted-foreground",
                    "hover:border-rune hover:text-parchment"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
