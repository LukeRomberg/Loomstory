"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface StepHeadingProps {
  title: string;
  subtitle?: string;
  helpText?: string;
}

export function StepHeading({ title, subtitle, helpText }: StepHeadingProps) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center gap-2">
        <h2 className="font-heading text-3xl text-gold">{title}</h2>
        {helpText && (
          <button
            onClick={() => setShowHelp((v) => !v)}
            aria-label={showHelp ? "Hide help" : "Show help"}
            className={cn(
              "size-5 rounded-full border text-xs flex items-center justify-center shrink-0 transition-colors",
              showHelp
                ? "border-gold/60 text-gold bg-gold/10"
                : "border-muted-foreground/30 text-muted-foreground/50 hover:border-muted-foreground/60 hover:text-muted-foreground"
            )}
          >
            ?
          </button>
        )}
      </div>
      {subtitle && (
        <p className="text-muted-foreground font-lore text-sm mt-2">
          {subtitle}
        </p>
      )}
      {showHelp && helpText && (
        <div className="mt-4 rounded-xl border border-rune bg-muted/30 p-4 text-left animate-fade-in">
          <p className="text-xs text-muted-foreground font-lore leading-relaxed">
            {helpText}
          </p>
        </div>
      )}
    </div>
  );
}
