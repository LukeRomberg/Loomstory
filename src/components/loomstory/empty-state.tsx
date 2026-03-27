import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, message, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <Icon className="size-12 text-rune mx-auto mb-4" />
      <p className="text-muted-foreground font-lore">{message}</p>
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
