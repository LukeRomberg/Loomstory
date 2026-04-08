"use client";

import { cn } from "@/lib/utils";

export interface StatSlot {
  key: string;
  label: string;
  group?: string;
}

interface StatAssignerProps {
  slots: StatSlot[];
  standardArray: number[];
  values: Record<string, number>;
  onChange: (values: Record<string, number>) => void;
  markCount?: number;
  markedKeys?: string[];
  onMarkedChange?: (keys: string[]) => void;
}

export function StatAssigner({
  slots,
  standardArray,
  values,
  onChange,
  markCount,
  markedKeys = [],
  onMarkedChange,
}: StatAssignerProps) {
  // Track which array values are used (by index, since duplicates exist)
  function getAvailableValues(currentKey: string): number[] {
    const used = new Map<number, number>(); // value -> count used
    for (const [key, val] of Object.entries(values)) {
      if (key === currentKey) continue;
      used.set(val, (used.get(val) ?? 0) + 1);
    }

    const pool = new Map<number, number>(); // value -> count available
    for (const v of standardArray) {
      pool.set(v, (pool.get(v) ?? 0) + 1);
    }

    const available: number[] = [];
    const seen = new Set<number>();
    for (const v of [...standardArray].sort((a, b) => b - a)) {
      if (seen.has(v)) continue;
      const totalAvailable = pool.get(v) ?? 0;
      const totalUsed = used.get(v) ?? 0;
      const remaining = totalAvailable - totalUsed;
      for (let i = 0; i < remaining; i++) {
        available.push(v);
      }
      seen.add(v);
    }

    return [...new Set(available)].sort((a, b) => b - a);
  }

  function handleValueChange(key: string, value: string) {
    if (value === "") {
      const next = { ...values };
      delete next[key];
      onChange(next);
    } else {
      onChange({ ...values, [key]: Number(value) });
    }
  }

  function handleMarkToggle(key: string) {
    if (!onMarkedChange) return;
    if (markedKeys.includes(key)) {
      onMarkedChange(markedKeys.filter((k) => k !== key));
    } else {
      onMarkedChange([...markedKeys, key]);
    }
  }

  const showMarks = markCount != null && onMarkedChange != null;
  const atMarkMax = showMarks && markedKeys.length >= markCount;

  // Group slots by group label
  const groups: { label: string | null; slots: StatSlot[] }[] = [];
  const groupMap = new Map<string | null, StatSlot[]>();
  for (const slot of slots) {
    const groupKey = slot.group ?? null;
    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, []);
      groups.push({ label: groupKey, slots: groupMap.get(groupKey)! });
    }
    groupMap.get(groupKey)!.push(slot);
  }

  return (
    <div className="space-y-4">
      {showMarks && (
        <div className="flex items-center justify-center gap-2">
          <span
            className={cn(
              "text-[10px] font-mono",
              markedKeys.length === markCount ? "text-emerald-400" : "text-gold/70"
            )}
          >
            {markedKeys.length} / {markCount} marked
          </span>
        </div>
      )}

      {groups.map((group) => (
        <div key={group.label ?? "ungrouped"}>
          {group.label && (
            <div className="text-[10px] font-heading uppercase tracking-wider text-muted-foreground mb-2">
              {group.label}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {group.slots.map((slot) => {
              const available = getAvailableValues(slot.key);
              const currentVal = values[slot.key];
              const isMarked = markedKeys.includes(slot.key);

              return (
                <div
                  key={slot.key}
                  className="rounded-lg border border-rune/40 bg-black/20 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-heading text-foreground">
                      {slot.label}
                    </span>
                    {showMarks && (
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          role="checkbox"
                          checked={isMarked}
                          disabled={!isMarked && atMarkMax}
                          onChange={() => handleMarkToggle(slot.key)}
                          className="size-3.5 rounded border-rune accent-gold"
                        />
                        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
                          Mark
                        </span>
                      </label>
                    )}
                  </div>
                  <select
                    role="combobox"
                    value={currentVal != null ? String(currentVal) : ""}
                    onChange={(e) => handleValueChange(slot.key, e.target.value)}
                    className="w-full rounded-md border border-rune bg-muted px-2 py-1.5 text-sm font-mono text-foreground"
                  >
                    <option value="">—</option>
                    {currentVal != null && !available.includes(currentVal) && (
                      <option value={String(currentVal)}>
                        {currentVal >= 0 ? `+${currentVal}` : currentVal}
                      </option>
                    )}
                    {available.map((v) => (
                      <option key={v} value={String(v)}>
                        {v >= 0 ? `+${v}` : v}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
