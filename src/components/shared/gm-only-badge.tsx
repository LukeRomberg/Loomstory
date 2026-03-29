import { Badge } from "@/components/ui/badge";
import { EyeOff } from "lucide-react";

export function GmOnlyBadge() {
  return (
    <Badge variant="secondary" className="text-xs">
      <EyeOff className="size-3 mr-1" />
      GM Only
    </Badge>
  );
}
