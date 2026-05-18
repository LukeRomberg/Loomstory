import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  tone?: "default" | "leather";
}

export function EmptyState({
  icon: Icon,
  message,
  action,
  tone = "default",
}: EmptyStateProps) {
  const iconClass = tone === "leather" ? "text-leather/40" : "text-rune";
  const messageClass =
    tone === "leather" ? "text-leather/70" : "text-muted-foreground";
  return (
    <div className="text-center py-12">
      <Icon className={`size-12 mx-auto mb-4 ${iconClass}`} />
      <p className={`font-lore ${messageClass}`}>{message}</p>
      {action && (
        <Button
          onClick={action.onClick}
          className="gold-glow font-heading mt-4"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
