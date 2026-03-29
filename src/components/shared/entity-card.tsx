"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GmOnlyBadge } from "./gm-only-badge";

interface BadgeItem {
  label: string;
  variant: "default" | "secondary" | "outline" | "destructive";
}

interface EntityCardProps {
  name: string;
  description?: string | null;
  badges?: BadgeItem[];
  gmOnly?: boolean;
  onClick: () => void;
}

export function EntityCard({
  name,
  description,
  badges,
  gmOnly,
  onClick,
}: EntityCardProps) {
  return (
    <Card className="grain gold-glow cursor-pointer" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="font-heading">{name}</CardTitle>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {gmOnly && <GmOnlyBadge />}
            {badges?.map((badge, i) => (
              <Badge key={i} variant={badge.variant} className="text-xs">
                {badge.label}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
