import { Dices } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewCampaignBookProps {
  onClick: () => void;
  className?: string;
}

export function NewCampaignBook({ onClick, className }: NewCampaignBookProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="new-campaign-book"
      className={cn(
        "group/new relative flex h-44 w-28 flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed border-gold/50 bg-leather/40 p-3 transition-all duration-200 hover:border-gold hover:bg-leather/60 hover:-translate-y-1",
        className
      )}
    >
      <Dices
        data-testid="new-campaign-emblem"
        className="size-10 text-gold/80 transition-colors group-hover/new:text-gold"
        aria-hidden="true"
      />
      <span className="font-heading text-[10px] uppercase tracking-[0.16em] text-gold/80 sm:text-xs group-hover/new:text-gold">
        New Campaign
      </span>
    </button>
  );
}
