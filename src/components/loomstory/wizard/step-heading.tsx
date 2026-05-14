"use client";

interface StepHeadingProps {
  title: string;
  subtitle?: string;
  helpText?: string;
}

export function StepHeading({ title, subtitle, helpText }: StepHeadingProps) {
  return (
    <div className="text-center mb-8">
      <h2 className="font-heading text-3xl text-gold">{title}</h2>
      {subtitle && (
        <p className="text-muted-foreground font-lore text-sm mt-2">
          {subtitle}
        </p>
      )}
      {helpText && (
        <div className="mt-3 mx-auto max-w-2xl rounded-xl border border-rune bg-muted/30 p-3 text-left">
          <p className="text-xs text-muted-foreground font-lore leading-relaxed">
            {helpText}
          </p>
        </div>
      )}
    </div>
  );
}
