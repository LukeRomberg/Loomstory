"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { MasterDetailModal } from "@/components/shared/master-detail-modal";
import { CharacterWizard } from "@/components/loomstory/wizard/character-wizard";
import { getWizardConfig } from "@/lib/character/wizard-registry";
import { Heart } from "lucide-react";

interface Character {
  id: string;
  name: string;
  level: number;
  hp_current: number | null;
  hp_max: number | null;
  system_id: string;
  user_id: string | null;
  portrait_url: string | null;
  data: Record<string, unknown>;
}

interface CharacterModalProps {
  campaignId: string;
  userId: string;
  role: string;
  systemId: string | null;
  systemSlug: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CharacterModal({
  campaignId,
  userId,
  role,
  systemId,
  systemSlug,
  open,
  onOpenChange,
}: CharacterModalProps) {
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  const wizardConfig = systemSlug ? getWizardConfig(systemSlug) : null;

  const fetchCharacters = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("characters")
      .select("id, name, level, hp_current, hp_max, system_id, user_id, portrait_url, data")
      .eq("campaign_id", campaignId)
      .is("deleted_at", null)
      .order("name");
    setCharacters(data ?? []);
    setLoading(false);
  }, [campaignId]);

  useEffect(() => {
    if (open) fetchCharacters();
  }, [open, fetchCharacters]);

  const classLabel = (char: Character) =>
    (char.data?.class as string) ?? (char.data?.playbook as string) ?? null;
  const raceLabel = (char: Character) =>
    (char.data?.race as string) ?? (char.data?.ancestry as string) ?? null;

  return (
    <>
      <MasterDetailModal<Character>
        title="Characters"
        open={open}
        onOpenChange={onOpenChange}
        items={characters}
        loading={loading}
        onCreateClick={() => {
          if (!wizardConfig || !systemId) {
            toast.error("Character creation not available", {
              description: "Character creation is currently only set up for Daggerheart.",
            });
            return;
          }
          onOpenChange(false);
          setWizardOpen(true);
        }}
        createLabel="New Character"
        emptyMessage="No characters yet. Create one to get started."
        searchPlaceholder="Search characters..."
        renderListItem={(char, isSelected) => (
          <div>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${isSelected ? "text-gold" : ""}`}>
                {char.name}
              </span>
              <Badge variant="outline" className="text-xs">Lv {char.level}</Badge>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {raceLabel(char) && (
                <span className="text-xs text-muted-foreground">{raceLabel(char)}</span>
              )}
              {classLabel(char) && (
                <span className="text-xs text-muted-foreground">{classLabel(char)}</span>
              )}
            </div>
          </div>
        )}
        renderDetail={(char) => (
          <CharacterQuickView char={char} campaignId={campaignId} />
        )}
      />

      {/* Character Creation Wizard */}
      {wizardConfig && systemId && (
        <CharacterWizard
          open={wizardOpen}
          onClose={() => {
            setWizardOpen(false);
            fetchCharacters();
          }}
          campaignId={campaignId}
          systemId={systemId}
          systemSlug={systemSlug!}
          userId={userId}
          wizardConfig={wizardConfig}
        />
      )}
    </>
  );
}

// ─── Quick View (sidebar detail) ──────────────────────────

function CharacterQuickView({ char, campaignId }: { char: Character; campaignId: string }) {
  const router = useRouter();
  const hpPercent = char.hp_max ? ((char.hp_current ?? 0) / char.hp_max) * 100 : 0;
  const classLabel = (char.data?.class as string) ?? (char.data?.playbook as string) ?? null;
  const raceLabel = (char.data?.race as string) ?? (char.data?.ancestry as string) ?? null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-heading text-lg">{char.name}</h3>
        <p className="text-sm text-muted-foreground">
          Level {char.level}
          {raceLabel ? ` ${raceLabel}` : ""}
          {classLabel ? ` ${classLabel}` : ""}
        </p>
      </div>

      {char.hp_max != null && (
        <div className="flex items-center gap-2">
          <Heart className={`size-4 ${hpPercent > 50 ? "text-emerald-500" : hpPercent > 25 ? "text-amber-500" : "text-destructive"}`} />
          <span className="font-mono text-sm">{char.hp_current}/{char.hp_max} HP</span>
        </div>
      )}

      <button
        onClick={() => router.push(`/campaign/${campaignId}/characters/${char.id}`)}
        className="text-sm text-gold hover:underline"
      >
        Open full character sheet →
      </button>
    </div>
  );
}
