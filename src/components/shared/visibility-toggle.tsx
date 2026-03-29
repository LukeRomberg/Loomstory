"use client";

import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

interface VisibilityToggleProps {
  gmOnly: boolean;
  onToggle: () => void;
  loading?: boolean;
}

export function VisibilityToggle({
  gmOnly,
  onToggle,
  loading,
}: VisibilityToggleProps) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={onToggle}
      disabled={loading}
      title={gmOnly ? "Make visible to players" : "Hide from players"}
    >
      {gmOnly ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
    </Button>
  );
}
