import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface WizardFooterProps {
  onContinue: () => void;
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  onSkip?: () => void;
  skipLabel?: string;
}

export function WizardFooter({
  onContinue,
  label = "Continue",
  disabled,
  loading,
  loadingLabel = "Loading...",
  onSkip,
  skipLabel,
}: WizardFooterProps) {
  return (
    <div className="mt-6 flex flex-col items-center gap-3">
      <Button
        onClick={onContinue}
        disabled={disabled || loading}
        className="w-full gold-glow font-heading text-lg py-6"
      >
        {loading && <Loader2 className="size-5 mr-1.5 animate-spin" />}
        {loading ? loadingLabel : label}
      </Button>
      {onSkip && skipLabel && (
        <button
          onClick={onSkip}
          className="text-base text-muted-foreground hover:text-foreground transition-colors"
        >
          {skipLabel}
        </button>
      )}
    </div>
  );
}
