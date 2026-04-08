"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/loomstory/empty-state";
import { CharacterWizard } from "@/components/loomstory/wizard/character-wizard";
import { getWizardConfig } from "@/lib/character/wizard-registry";
import { ChevronLeft, Plus, UserCircle, Heart } from "lucide-react";

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

interface CharacterListProps {
  campaignId: string;
  campaignName: string;
  characters: Character[];
  role: string;
  userId: string;
  systemId: string | null;
  systemSlug: string | null;
}

function hpColor(percent: number): string {
  if (percent > 50) return "text-emerald-500";
  if (percent > 25) return "text-amber-500";
  return "text-destructive";
}

export function CharacterList({
  campaignId,
  campaignName,
  characters: initialCharacters,
  role,
  userId,
  systemId,
  systemSlug,
}: CharacterListProps) {
  const router = useRouter();
  const [characters] = useState(initialCharacters);
  const [wizardOpen, setWizardOpen] = useState(false);

  const wizardConfig = systemSlug ? getWizardConfig(systemSlug) : null;

  const classLabel = (char: Character) => {
    const d = char.data;
    return (d?.class as string) ?? (d?.playbook as string) ?? null;
  };

  const raceLabel = (char: Character) => {
    const d = char.data;
    return (d?.race as string) ?? (d?.ancestry as string) ?? null;
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <button
            onClick={() => router.push(`/campaign/${campaignId}`)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
          >
            <ChevronLeft className="size-4" />
            {campaignName}
          </button>
          <h2 className="text-2xl font-heading font-semibold">Characters</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {characters.length} character{characters.length !== 1 ? "s" : ""} in this campaign
          </p>
        </div>
        <Button
          onClick={() => setWizardOpen(true)}
          className="gold-glow font-heading"
        >
          <Plus className="size-4 mr-1.5" />
          New Character
        </Button>
      </div>

      {characters.length === 0 ? (
        <EmptyState
          icon={UserCircle}
          message="No characters yet. Create one to get started."
          action={{ label: "New Character", onClick: () => setWizardOpen(true) }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((char) => (
            <Card
              key={char.id}
              className="grain gold-glow cursor-pointer"
              onClick={() => router.push(`/campaign/${campaignId}/characters/${char.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="font-heading">{char.name}</CardTitle>
                  <Badge variant="outline" className="text-xs shrink-0 ml-2">
                    Level {char.level}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  {raceLabel(char) && <span>{raceLabel(char)}</span>}
                  {raceLabel(char) && classLabel(char) && <span>·</span>}
                  {classLabel(char) && <span>{classLabel(char)}</span>}
                </div>
                {char.hp_max != null && char.hp_current != null && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Heart className={`size-3.5 ${hpColor((char.hp_current / char.hp_max) * 100)}`} />
                    <span className="font-mono text-xs">
                      {char.hp_current}/{char.hp_max} HP
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Character Creation Wizard */}
      {wizardConfig && systemId && (
        <CharacterWizard
          open={wizardOpen}
          onClose={() => {
            setWizardOpen(false);
            router.refresh();
          }}
          campaignId={campaignId}
          systemId={systemId}
          systemSlug={systemSlug!}
          userId={userId}
          wizardConfig={wizardConfig}
        />
      )}
    </div>
  );
}
