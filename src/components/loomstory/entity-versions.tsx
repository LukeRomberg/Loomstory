"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookCard,
  BookCardContent,
} from "@/components/shared/book-card";
import { SectionHeader } from "@/components/loomstory/section-header";
import { EmptyState } from "@/components/loomstory/empty-state";
import { Clock, ChevronDown, ChevronUp, Plus, Minus, RefreshCw } from "lucide-react";

interface Version {
  id: string;
  entity_type: string;
  entity_id: string;
  version_number: number;
  snapshot: Record<string, unknown>;
  change_summary: string | null;
  changed_by: string;
  changed_by_name?: string;
  changed_at: string;
}

interface EntityVersionsProps {
  versions: Version[];
  tone?: "default" | "leather";
}

// Fields to skip in diffs (internal/auto-managed)
const SKIP_FIELDS = new Set([
  "id", "campaign_id", "created_by", "updated_by", "created_at",
  "updated_at", "deleted_at",
]);

function computeDiff(
  older: Record<string, unknown> | null,
  newer: Record<string, unknown>
): { field: string; oldVal: unknown; newVal: unknown; type: "added" | "changed" | "removed" }[] {
  const diffs: { field: string; oldVal: unknown; newVal: unknown; type: "added" | "changed" | "removed" }[] = [];
  const allKeys = new Set([
    ...Object.keys(newer),
    ...(older ? Object.keys(older) : []),
  ]);

  for (const key of allKeys) {
    if (SKIP_FIELDS.has(key)) continue;
    const oldVal = older?.[key] ?? null;
    const newVal = newer[key] ?? null;
    const oldStr = JSON.stringify(oldVal);
    const newStr = JSON.stringify(newVal);

    if (oldStr !== newStr) {
      if (oldVal === null || oldVal === undefined || oldVal === "") {
        diffs.push({ field: key, oldVal, newVal, type: "added" });
      } else if (newVal === null || newVal === undefined || newVal === "") {
        diffs.push({ field: key, oldVal, newVal, type: "removed" });
      } else {
        diffs.push({ field: key, oldVal, newVal, type: "changed" });
      }
    }
  }

  return diffs;
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "string") return val;
  if (Array.isArray(val)) return val.join(", ") || "—";
  return JSON.stringify(val);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString();
}

export function EntityVersions({
  versions,
  tone = "default",
}: EntityVersionsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const isLeather = tone === "leather";
  const CardCmp = isLeather ? BookCard : Card;
  const CardContentCmp = isLeather ? BookCardContent : CardContent;
  const mutedText = isLeather ? "text-leather/65" : "text-muted-foreground";

  if (versions.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        tone={isLeather ? "leather" : "default"}
        message="No version history yet. Edit this entity to start tracking changes."
      />
    );
  }

  const addedColor = isLeather ? "text-green-700" : "text-green-400";
  const removedColor = isLeather ? "text-red-700" : "text-red-400";

  // Sorted newest first (should already be, but ensure)
  const sorted = [...versions].sort((a, b) => b.version_number - a.version_number);

  return (
    <div className="space-y-4">
      <SectionHeader className={`flex items-center gap-2 mb-0 ${isLeather ? "!text-leather/70" : ""}`}>
        <Clock className="size-4 text-gold" />
        Version History
        <Badge variant="outline" className={isLeather ? "text-xs ml-1 border-leather/40 text-leather" : "text-xs ml-1"}>
          {versions.length} version{versions.length !== 1 ? "s" : ""}
        </Badge>
      </SectionHeader>

      <div className="space-y-2">
        {sorted.map((version, index) => {
          const isExpanded = expandedId === version.id;
          const isFirst = version.version_number === 1;
          const prevVersion = sorted[index + 1] ?? null;
          const diffs = isFirst
            ? null
            : computeDiff(prevVersion?.snapshot ?? null, version.snapshot);

          return (
            <CardCmp
              key={version.id}
              className={isLeather ? "cursor-pointer" : "grain cursor-pointer"}
              onClick={() => setExpandedId(isExpanded ? null : version.id)}
            >
              <CardContentCmp className="py-2">
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={isLeather ? "outline" : "default"} className={isLeather ? "text-xs font-mono border-leather/40 bg-leather/15 text-leather" : "text-xs font-mono"}>
                      v{version.version_number}
                    </Badge>
                    <span className={`text-sm font-medium ${isLeather ? "text-leather" : ""}`}>
                      {version.changed_by_name ?? "Unknown"}
                    </span>
                    <span className={`text-xs ${mutedText}`}>
                      {formatDate(version.changed_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isFirst && (
                      <Badge variant={isLeather ? "outline" : "secondary"} className={isLeather ? "text-xs border-leather/40 bg-leather/10 text-leather" : "text-xs"}>
                        Created
                      </Badge>
                    )}
                    {!isFirst && diffs && (
                      <span className={`text-xs ${mutedText}`}>
                        {diffs.length} field{diffs.length !== 1 ? "s" : ""} changed
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className={`size-4 ${mutedText}`} />
                    ) : (
                      <ChevronDown className={`size-4 ${mutedText}`} />
                    )}
                  </div>
                </div>

                {/* Expanded diff view */}
                {isExpanded && (
                  <div className={`mt-3 space-y-2 border-t pt-3 ${isLeather ? "border-leather/20" : "border-border"}`}>
                    {isFirst ? (
                      <div className="space-y-1.5">
                        <p className={`text-xs font-heading ${mutedText}`}>
                          Created with:
                        </p>
                        {Object.entries(version.snapshot)
                          .filter(([key]) => !SKIP_FIELDS.has(key))
                          .filter(([, val]) => val !== null && val !== undefined && val !== "")
                          .map(([key, val]) => (
                            <div key={key} className="flex items-start gap-2 text-xs">
                              <Plus className={`size-3 ${addedColor} shrink-0 mt-0.5`} />
                              <span className={`font-mono w-28 shrink-0 ${mutedText}`}>
                                {key}
                              </span>
                              <span className={isLeather ? "text-leather" : "text-foreground"}>
                                {formatValue(val)}
                              </span>
                            </div>
                          ))}
                      </div>
                    ) : diffs && diffs.length > 0 ? (
                      <div className="space-y-1.5">
                        {diffs.map((diff) => (
                          <div key={diff.field} className="flex items-start gap-2 text-xs">
                            {diff.type === "added" && (
                              <Plus className={`size-3 ${addedColor} shrink-0 mt-0.5`} />
                            )}
                            {diff.type === "removed" && (
                              <Minus className={`size-3 ${removedColor} shrink-0 mt-0.5`} />
                            )}
                            {diff.type === "changed" && (
                              <RefreshCw className="size-3 text-gold shrink-0 mt-0.5" />
                            )}
                            <span className={`font-mono w-28 shrink-0 ${mutedText}`}>
                              {diff.field}
                            </span>
                            <div className="flex-1 min-w-0">
                              {diff.type === "changed" && (
                                <>
                                  <span className={`${removedColor} line-through`}>
                                    {formatValue(diff.oldVal)}
                                  </span>
                                  <span className={`mx-1 ${mutedText}`}>→</span>
                                  <span className={addedColor}>
                                    {formatValue(diff.newVal)}
                                  </span>
                                </>
                              )}
                              {diff.type === "added" && (
                                <span className={addedColor}>
                                  {formatValue(diff.newVal)}
                                </span>
                              )}
                              {diff.type === "removed" && (
                                <span className={`${removedColor} line-through`}>
                                  {formatValue(diff.oldVal)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className={`text-xs italic ${mutedText}`}>
                        No field changes detected.
                      </p>
                    )}
                  </div>
                )}
              </CardContentCmp>
            </CardCmp>
          );
        })}
      </div>
    </div>
  );
}
