"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";

export interface ReviewItem {
  label: string;
  value: string;
}

export interface ReviewSection {
  label: string;
  items: ReviewItem[];
}

interface ReviewSummaryProps {
  sections: ReviewSection[];
  onCreate: () => void;
  creating?: boolean;
  buttonLabel?: string;
}

export function ReviewSummary({
  sections,
  onCreate,
  creating,
  buttonLabel = "Create Character",
}: ReviewSummaryProps) {
  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.label} className="rounded-xl border border-rune/40 bg-black/20 p-4">
          <div className="text-sm font-heading uppercase tracking-wider text-muted-foreground mb-3">
            {section.label}
          </div>
          <div className="space-y-1.5">
            {section.items.map((item) => (
              <div key={item.label} className="flex items-baseline justify-between gap-2">
                <span className="text-base text-muted-foreground">{item.label}</span>
                <span className="text-lg font-heading text-foreground text-right">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <Button
        onClick={onCreate}
        disabled={creating}
        className="w-full gold-glow font-heading text-xl py-6"
      >
        {creating ? (
          <>
            <Loader2 className="size-4 mr-1.5 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <Sparkles className="size-4 mr-1.5" />
            {buttonLabel}
          </>
        )}
      </Button>
    </div>
  );
}
