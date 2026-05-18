"use client";

import { useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmblemPickerProps {
  availableEmblems: readonly string[];
  value: string | null;
  onChange: (emblem: string | null) => void;
  loading?: boolean;
  className?: string;
  /** Maximum icons to render at once. Defaults to 120 — keeps scroll snappy. */
  maxVisible?: number;
}

function shortName(iconifyName: string): string {
  return iconifyName.replace(/^game-icons:/, "");
}

export function EmblemPicker({
  availableEmblems,
  value,
  onChange,
  loading = false,
  className,
  maxVisible = 120,
}: EmblemPickerProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return availableEmblems;
    return availableEmblems.filter((name) =>
      shortName(name).toLowerCase().includes(q)
    );
  }, [availableEmblems, query]);

  const visible = filtered.slice(0, maxVisible);
  const overflow = filtered.length - visible.length;

  if (loading) {
    return (
      <div
        data-testid="emblem-picker-loading"
        className={cn(
          "flex h-40 items-center justify-center rounded-md border border-gold/20 bg-leather/30",
          className
        )}
      >
        <span className="font-mono text-xs text-gold/60">
          Loading emblems…
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-gold/50"
        />
        <input
          type="search"
          placeholder="Search emblems…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-md border border-gold/20 bg-leather/30 py-1.5 pl-8 pr-2 text-sm text-gold placeholder:text-gold/40 focus:border-gold/60 focus:outline-none"
        />
      </div>

      {visible.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-gold/20 bg-leather/20">
          <span className="font-mono text-xs text-gold/60">
            No emblems match &ldquo;{query}&rdquo;
          </span>
        </div>
      ) : (
        <>
          <div className="grid max-h-72 grid-cols-6 gap-2 overflow-y-auto rounded-md border border-gold/20 bg-leather/20 p-2 sm:grid-cols-8 md:grid-cols-10">
            {visible.map((name) => {
              const isSelected = value === name;
              return (
                <button
                  key={name}
                  type="button"
                  data-testid="emblem-option"
                  data-emblem={name}
                  aria-label={shortName(name)}
                  aria-pressed={isSelected}
                  onClick={() => onChange(isSelected ? null : name)}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-md border border-transparent bg-leather/40 p-1 text-gold transition-all hover:border-gold/40 hover:bg-leather/60",
                    isSelected &&
                      "border-gold bg-gold/15 ring-2 ring-gold shadow-[inset_0_0_18px_rgba(200,162,94,0.35)]"
                  )}
                >
                  <Icon icon={name} className="size-6" />
                </button>
              );
            })}
          </div>
          {overflow > 0 && (
            <p className="text-center font-mono text-[10px] text-gold/50">
              Showing {visible.length} of {filtered.length}. Refine your search
              to see more.
            </p>
          )}
        </>
      )}
    </div>
  );
}
