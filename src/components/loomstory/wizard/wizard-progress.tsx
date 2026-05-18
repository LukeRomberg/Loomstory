"use client";

import { cn } from "@/lib/utils";

export interface WizardProgressStep {
  key: string;
  label: string;
}

interface WizardProgressProps {
  steps: WizardProgressStep[];
  currentStep: string;
  /**
   * Highest step index the player has ever reached, monotonically increasing.
   * Steps at or before this index are considered "visited" and stay clickable
   * even when the player has back-navigated. Omit and the component falls
   * back to currentIndex (backwards-only jumps).
   */
  maxReachedIndex?: number;
  /**
   * Optional handler invoked when a visited step label is clicked. The
   * current step and never-visited future steps stay non-interactive.
   */
  onStepClick?: (key: string) => void;
}

export function WizardProgress({ steps, currentStep, maxReachedIndex, onStepClick }: WizardProgressProps) {
  const currentIndex = Math.max(
    0,
    steps.findIndex((s) => s.key === currentStep)
  );
  const reachedIndex = Math.max(currentIndex, maxReachedIndex ?? currentIndex);
  const total = steps.length;

  return (
    <div className="mb-8">
      {/* Mobile: "Step x / y" */}
      <div className="flex sm:hidden items-center justify-center gap-1 mb-2">
        <span className="text-xs text-muted-foreground font-heading tracking-wider">
          Step <span className="text-gold">{currentIndex + 1}</span> / {total}
        </span>
      </div>

      {/* Desktop: one labeled dot per step */}
      <div className="hidden sm:flex items-center gap-0">
        {steps.map((step, i) => {
          const isDone = i < currentIndex;
          const isCurrent = i === currentIndex;
          // Visited = anywhere from start up to the high-water mark, *except*
          // the current step itself (clicking your own step is a no-op).
          const isVisited = i <= reachedIndex && !isCurrent;
          const isClickable = isVisited && onStepClick != null;
          const labelClass = cn(
            "text-sm font-heading font-bold uppercase tracking-wider whitespace-nowrap transition-colors",
            isCurrent
              ? "text-gold"
              : isDone
                ? "text-gold/70"
                : "text-gold/40",
            isClickable && "cursor-pointer hover:text-gold"
          );
          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div
                  className={cn(
                    "size-3 rounded-full transition-all duration-300",
                    isDone
                      ? "bg-gold/70"
                      : isCurrent
                        ? "bg-gold ring-2 ring-gold/30"
                        : "bg-gold/30"
                  )}
                />
                {isClickable ? (
                  <button
                    type="button"
                    onClick={() => onStepClick(step.key)}
                    className={cn(labelClass, "bg-transparent border-0 p-0")}
                  >
                    {step.label}
                  </button>
                ) : (
                  <span className={labelClass}>{step.label}</span>
                )}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-px mx-1 transition-colors duration-300",
                    i < currentIndex ? "bg-gold/40" : "bg-rune/40"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-0.5 bg-rune/30 rounded-full overflow-hidden">
        <div
          data-testid="progress-fill"
          className="h-full bg-gold/60 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
        />
      </div>
    </div>
  );
}
