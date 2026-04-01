"use client";

import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface IconButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive";
  disabled?: boolean;
  className?: string;
}

export function IconButton({
  icon: Icon,
  label,
  onClick,
  variant = "default",
  disabled,
  className,
}: IconButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "gold-glow",
        variant === "destructive" && "text-destructive hover:text-destructive",
        className,
      )}
    >
      <Icon className="size-4" />
    </Button>
  );
}
