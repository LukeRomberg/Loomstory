"use client";

import { cn } from "@/lib/utils";

export interface WizardProgressStep {
  key: string;
  label: string;
}

interface WizardProgressProps {
  steps: WizardProgressStep[];
  currentStep: string;
}

export function WizardProgress({ steps, currentStep }: WizardProgressProps) {
  const currentIndex = Math.max(
    0,
    steps.findIndex((s) => s.key === currentStep)
  );
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
          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
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
                    "text-[9px] font-heading uppercase tracking-wider whitespace-nowrap transition-colors",
                    isCurrent
                      ? "text-gold"
                      : isDone
                        ? "text-muted-foreground/60"
                        : "text-muted-foreground/30"
                  )}
                >
                  {step.label}
                </span>
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
