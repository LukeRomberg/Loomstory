"use client";

import { useState, useMemo, useCallback } from "react";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { OpenBookView } from "@/components/shared/open-book-view";
import {
  MasterList,
  MasterListItem,
} from "@/components/shared/master-list";
import { CharacterCreationWizard } from "@/components/loomstory/wizard/character-creation-wizard";
import { getWizardConfig } from "@/lib/character/wizard-registry";
import { CharacterSheetLoader } from "./character-sheet-loader";
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

interface CharacterListProps {
  campaignId: string;
  campaignName: string;
  characters: Character[];
  role: string;
  userId: string;
  systemId: string | null;
  systemSlug: string | null;
}

function classLabel(char: Character) {
  const d = char.data;
  return (d?.class as string) ?? (d?.playbook as string) ?? null;
}

function raceLabel(char: Character) {
  const d = char.data;
  return (d?.race as string) ?? (d?.ancestry as string) ?? null;
}

function hpColor(percent: number): string {
  if (percent > 50) return "text-emerald-700";
  if (percent > 25) return "text-amber-700";
  return "text-red-700";
}

export function CharacterList({
  campaignId,
  campaignName: _campaignName,
  characters: initialCharacters,
  role,
  userId,
  systemId,
  systemSlug,
}: CharacterListProps) {
  const router = useTransitionRouter();
  const searchParams = useSearchParams();
  const [characters] = useState(initialCharacters);
  const [search, setSearch] = useState("");
  const urlSelected = searchParams.get("selected");
  const [selectedId, setSelectedId] = useState<string | null>(
    urlSelected ?? initialCharacters[0]?.id ?? null
  );
  const [wizardOpen, setWizardOpen] = useState(false);

  const wizardConfig = systemSlug ? getWizardConfig(systemSlug) : null;

  const filtered = useMemo(() => {
    if (!search.trim()) return characters;
    const q = search.toLowerCase();
    return characters.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        classLabel(c)?.toLowerCase().includes(q) ||
        raceLabel(c)?.toLowerCase().includes(q)
    );
  }, [characters, search]);

  const selected =
    filtered.find((c) => c.id === selectedId) ?? filtered[0] ?? null;

  const selectCharacter = useCallback(
    (id: string) => {
      setSelectedId(id);
      router.replace(`/campaign/${campaignId}/characters?selected=${id}`);
    },
    [campaignId, router]
  );

  const leftPage = (
    <MasterList
      title="Characters"
      count={characters.length}
      search={search}
      onSearchChange={setSearch}
      isEmpty={filtered.length === 0}
      emptyMessage={
        characters.length === 0 ? "No characters yet." : "No matches."
      }
    >
      {filtered.map((char) => {
        const race = raceLabel(char);
        const klass = classLabel(char);
        const hpPercent =
          char.hp_max != null && char.hp_current != null
            ? (char.hp_current / char.hp_max) * 100
            : null;
        return (
          <MasterListItem
            key={char.id}
            selected={selected?.id === char.id}
            onClick={() => selectCharacter(char.id)}
            title={char.name}
            subtitle={
              <span className="flex items-center gap-1.5">
                <Badge
                  variant="outline"
                  className="border-leather/40 bg-leather/10 text-[10px] font-semibold uppercase text-leather"
                >
                  Lv {char.level}
                </Badge>
                <span className="normal-case font-medium tracking-normal text-leather/70">
                  {[race, klass].filter(Boolean).join(" · ") || "Unfinished"}
                </span>
                {hpPercent != null && (
                  <span className="ml-auto flex items-center gap-0.5 normal-case font-medium tracking-normal">
                    <Heart className={`size-3 ${hpColor(hpPercent)}`} />
                    <span className="font-mono text-leather/70">
                      {char.hp_current}/{char.hp_max}
                    </span>
                  </span>
                )}
              </span>
            }
          />
        );
      })}
    </MasterList>
  );

  const rightPage = selected ? (
    <CharacterSheetLoader
      key={selected.id}
      characterId={selected.id}
      campaignId={campaignId}
      systemId={systemId}
      role={role}
      userId={userId}
    />
  ) : (
    <div className="flex h-full items-center justify-center text-xs italic text-leather/60">
      Select a character to view.
    </div>
  );

  return (
    <OpenBookView
      leftPage={leftPage}
      rightPage={rightPage}
      onBack={() => router.push(`/campaign/${campaignId}`)}
      onNew={() => setWizardOpen(true)}
      newAriaLabel="New character"
    >
      {wizardConfig && systemId && (
        <CharacterCreationWizard
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
    </OpenBookView>
  );
}
