"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  key: string;
  label: string;
  count: number;
}

interface ExtractionStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (index: number) => void;
}

export function ExtractionStepper({
  steps,
  currentStep,
  onStepClick,
}: ExtractionStepperProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto p-1">
      {steps.map((step, i) => {
        const isActive = i === currentStep;
        const isPast = i < currentStep;

        return (
          <div key={step.key} className="flex items-center">
            {i > 0 && (
              <div
                className={cn(
                  "h-px w-6 mx-1",
                  isPast ? "bg-gold" : "bg-border"
                )}
              />
            )}
            <button
              onClick={() => onStepClick(i)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-heading transition-all whitespace-nowrap",
                isActive &&
                  "bg-gold/10 text-gold ring-1 ring-gold/30",
                isPast &&
                  "text-gold/70 hover:text-gold",
                !isActive &&
                  !isPast &&
                  "text-muted-foreground hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-xs font-medium",
                  isActive && "bg-gold text-background",
                  isPast && "bg-gold/20 text-gold",
                  !isActive && !isPast && "bg-muted text-muted-foreground"
                )}
              >
                {isPast ? <Check className="size-3" /> : i + 1}
              </span>
              {step.label}
              {step.count > 0 && (
                <span
                  className={cn(
                    "text-xs",
                    isActive ? "text-gold" : "text-muted-foreground"
                  )}
                >
                  ({step.count})
                </span>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
