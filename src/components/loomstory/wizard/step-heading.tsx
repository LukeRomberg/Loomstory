"use client";

import { cn } from "@/lib/utils";

interface StepHeadingProps {
  title: string;
  subtitle?: string;
  /** If provided alongside helpText, a ? icon renders next to the title that calls this on click. */
  helpText?: string;
  onHelpClick?: () => void;
}

export function StepHeading({ title, subtitle, helpText, onHelpClick }: StepHeadingProps) {
  const showHelpButton = !!(helpText && onHelpClick);

  return (
    <div className="text-right mb-2 shrink-0">
      <div className="flex items-baseline justify-end gap-2">
        <h2 className="font-heading text-xl text-gold leading-none">{title}</h2>
        {showHelpButton && (
          <button
            type="button"
            onClick={onHelpClick}
            aria-label="Show help"
            className={cn(
              "size-5 rounded-full border text-xs flex items-center justify-center shrink-0 transition-colors cursor-pointer",
              "border-muted-foreground/30 text-muted-foreground/50 hover:border-gold/60 hover:text-gold"
            )}
          >
            ?
          </button>
        )}
      </div>
      {subtitle && (
        <p className="text-muted-foreground font-lore text-xs mt-1 max-w-md ml-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}
