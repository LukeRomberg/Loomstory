"use client";

import { cn } from "@/lib/utils";

export interface ChipOption {
  id: string;
  label: string;
  description?: string;
  locked?: boolean;
}

interface ChipSelectorProps {
  options: ChipOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  max?: number;
  label?: string;
}

export function ChipSelector({
  options,
  selected,
  onChange,
  max,
  label,
}: ChipSelectorProps) {
  const atMax = max != null && selected.length >= max;
  const isSingleSelect = max === 1;

  function handleClick(id: string, isLocked: boolean) {
    if (isLocked) return;

    const isSelected = selected.includes(id);
    if (isSelected) {
      onChange(selected.filter((s) => s !== id));
    } else if (isSingleSelect) {
      onChange([id]);
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <div className="space-y-2">
      {(label || max != null) && (
        <div className="flex items-center gap-2">
          {label && (
            <span className="text-[10px] font-heading uppercase tracking-wider text-muted-foreground">
              {label}
            </span>
          )}
          {max != null && (
            <span
              className={cn(
                "text-[10px] font-mono",
                selected.length === max ? "text-emerald-400" : "text-gold/70"
              )}
            >
              {selected.length} / {max}
            </span>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const isSelected = selected.includes(option.id);
          const isLocked = option.locked === true;
          const isDisabled = isLocked || (!isSelected && atMax && !isSingleSelect);

          return (
            <button
              key={option.id}
              disabled={isDisabled}
              onClick={() => handleClick(option.id, isLocked)}
              className={cn(
                "text-[11px] rounded px-2.5 py-1 border transition-colors",
                isSelected || isLocked
                  ? "border-gold/50 bg-gold/10 text-parchment"
                  : isDisabled
                    ? "border-rune/30 bg-black/10 text-muted-foreground/40 cursor-not-allowed"
                    : "border-rune/60 bg-black/30 text-muted-foreground hover:border-rune hover:text-parchment"
              )}
            >
              <span>{option.label}</span>
              {option.description && (
                <span className="block text-[9px] text-muted-foreground/60 mt-0.5">
                  {option.description}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
