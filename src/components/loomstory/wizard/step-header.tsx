"use client";

import { StepHeading } from "./step-heading";
import { BackButton } from "./back-button";

interface StepHeaderProps {
  title: string;
  subtitle?: string;
  helpText?: string;
  onHelpClick?: () => void;
  /**
   * Renders a Back button on the left when provided. Omit on the first step
   * of the wizard — there's nothing to navigate to.
   */
  onBack?: () => void;
  /**
   * Optional center-aligned controls (e.g. M/F portrait toggle on the
   * ancestry pick step). Sits between Back on the left and the heading on
   * the right.
   */
  children?: React.ReactNode;
}

/**
 * Single-row wizard step header. Lays out, left-to-right:
 *   [Back button?]  [center children?]  [StepHeading on right]
 *
 * Frees up the vertical space the previous big-centered heading + separate
 * Back button were eating up, so step content gets the room it needs.
 */
export function StepHeader({
  title,
  subtitle,
  helpText,
  onHelpClick,
  onBack,
  children,
}: StepHeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-3 shrink-0">
      <div className="shrink-0">
        {onBack && <BackButton onClick={onBack} />}
      </div>
      <div className="flex-1 flex justify-center min-w-0">{children}</div>
      <StepHeading
        title={title}
        subtitle={subtitle}
        helpText={helpText}
        onHelpClick={onHelpClick}
      />
    </div>
  );
}
