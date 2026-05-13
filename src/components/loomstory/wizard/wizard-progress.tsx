"use client";

import { cn } from "@/lib/utils";

export interface WizardPhase {
  label: string;
  steps: string[];
}

interface WizardProgressProps {
  phases: WizardPhase[];
  currentStep: string;
}

export function WizardProgress({ phases, currentStep }: WizardProgressProps) {
  const currentPhase = phases.findIndex((p) => p.steps.includes(currentStep));
  const total = phases.length;

  return (
    <div className="mb-8">
      {/* Mobile: "Step x / y" */}
      <div className="flex sm:hidden items-center justify-center gap-1 mb-2">
        <span className="text-base text-muted-foreground font-heading tracking-wider">
          Step <span className="text-gold">{currentPhase + 1}</span> / {total}
        </span>
      </div>

      {/* Desktop: labeled phase dots */}
      <div className="hidden sm:flex items-center gap-0">
        {phases.map((phase, i) => {
          const isDone = i < currentPhase;
          const isCurrent = i === currentPhase;
          return (
            <div key={phase.label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div
                  className={cn(
                    "size-2 rounded-full transition-all duration-300",
                    isDone
                      ? "bg-gold/70"
                      : isCurrent
                        ? "bg-gold ring-2 ring-gold/30"
                        : "bg-rune"
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-heading uppercase tracking-wider whitespace-nowrap transition-colors",
                    isCurrent
                      ? "text-gold"
                      : isDone
                        ? "text-muted-foreground/60"
                        : "text-muted-foreground/30"
                  )}
                >
                  {phase.label}
                </span>
              </div>
              {i < phases.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-px mx-1 transition-colors duration-300",
                    i < currentPhase ? "bg-gold/40" : "bg-rune/40"
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
          style={{ width: `${((currentPhase + 1) / total) * 100}%` }}
        />
      </div>
    </div>
  );
}
