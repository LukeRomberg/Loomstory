"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SectionHeader } from "@/components/loomstory/section-header";
import { ExternalLink, EyeOff } from "lucide-react";

interface Entity {
  id: string;
  name: string;
  aliases?: string[] | null;
  description?: string | null;
  status?: string;
  tags?: string[] | null;
  type?: string | null;
  goals?: string | null;
  gm_notes?: string | null;
  player_notes?: string | null;
  gm_only?: boolean;
}

interface EntityQuickViewProps {
  entity: Entity;
  entityType: "npc" | "location" | "faction" | "item";
  campaignId: string;
  role: string;
  open: boolean;
  onClose: () => void;
}

const ENTITY_ROUTES: Record<string, string> = {
  npc: "npcs",
  location: "locations",
  faction: "factions",
  item: "items",
};

export function EntityQuickView({
  entity,
  entityType,
  campaignId,
  role,
  open,
  onClose,
}: EntityQuickViewProps) {
  const router = useRouter();
  const isGm = role === "gm";
  const detailPath = `/campaign/${campaignId}/${ENTITY_ROUTES[entityType]}/${entity.id}`;

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg flex items-center gap-2">
            {entity.name}
            {entity.gm_only && (
              <Badge variant="secondary" className="text-xs">
                <EyeOff className="size-3 mr-1" />
                GM Only
              </Badge>
            )}
          </DialogTitle>
          {entity.aliases && entity.aliases.length > 0 && (
            <p className="text-xs text-muted-foreground italic">
              aka {entity.aliases.join(", ")}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-3">
          {/* Status + Tags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {entity.status && (
              <Badge variant="outline" className="text-xs">
                {entity.status}
              </Badge>
            )}
            {entity.type && (
              <Badge variant="outline" className="text-xs">
                {entity.type}
              </Badge>
            )}
            {entity.tags?.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Description */}
          {entity.description && (
            <div>
              <SectionHeader>Description</SectionHeader>
              <p className="text-sm font-lore">{entity.description}</p>
            </div>
          )}

          {/* Goals (factions) */}
          {entity.goals && (
            <div>
              <SectionHeader>Goals</SectionHeader>
              <p className="text-sm">{entity.goals}</p>
            </div>
          )}

          {/* GM Notes */}
          {isGm && entity.gm_notes && (
            <div>
              <SectionHeader>GM Notes</SectionHeader>
              <p className="text-sm italic text-muted-foreground">
                {entity.gm_notes}
              </p>
            </div>
          )}

          {/* Player Notes */}
          {entity.player_notes && (
            <div>
              <SectionHeader>Player Notes</SectionHeader>
              <p className="text-sm">{entity.player_notes}</p>
            </div>
          )}

          {/* View Details link */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              onClose();
              router.push(detailPath);
            }}
          >
            <ExternalLink className="size-4 mr-1.5" />
            View Details
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
