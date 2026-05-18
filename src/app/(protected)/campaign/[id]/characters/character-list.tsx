"use client";

import { useState, useMemo } from "react";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { OpenBookView } from "@/components/shared/open-book-view";
import { CharacterWizard } from "@/components/loomstory/wizard/character-wizard";
import { getWizardConfig } from "@/lib/character/wizard-registry";
import { cn } from "@/lib/utils";
import { ChevronRight, Heart } from "lucide-react";

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
  if (percent > 50) return "text-emerald-600";
  if (percent > 25) return "text-amber-600";
  return "text-destructive";
}

function classLabel(char: Character) {
  const d = char.data;
  return (d?.class as string) ?? (d?.playbook as string) ?? null;
}

function raceLabel(char: Character) {
  const d = char.data;
  return (d?.race as string) ?? (d?.ancestry as string) ?? null;
}

export function CharacterList({
  campaignId,
  campaignName: _campaignName,
  characters: initialCharacters,
  role: _role,
  userId,
  systemId,
  systemSlug,
}: CharacterListProps) {
  const router = useTransitionRouter();
  const [characters] = useState(initialCharacters);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialCharacters[0]?.id ?? null
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

  const selected = filtered.find((c) => c.id === selectedId) ?? filtered[0] ?? null;

  const leftPage = (
    <>
      <div className="flex shrink-0 items-center gap-2">
        <h2 className="mr-auto font-heading text-base uppercase tracking-[0.15em] text-leather sm:text-lg">
          Characters{" "}
          <span className="ml-1 font-sans text-xs font-normal text-leather/65 sm:text-sm">
            ({characters.length})
          </span>
        </h2>
        <Input
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-40 border-leather/30 bg-parchment/30 text-xs text-leather placeholder:text-leather/40"
        />
      </div>

      <div className="scrollbar-none flex-1 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-xs italic text-leather/60">
            {characters.length === 0 ? "No characters yet." : "No matches."}
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((char) => (
              <button
                key={char.id}
                onClick={() => setSelectedId(char.id)}
                className={cn(
                  "w-full rounded border border-leather/15 px-3 py-2 text-left transition",
                  "hover:bg-leather/5",
                  selected?.id === char.id && "border-leather/40 bg-leather/10"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="line-clamp-1 font-heading text-sm text-leather">
                    {char.name}
                  </div>
                  <Badge
                    variant="outline"
                    className="shrink-0 border-leather/40 text-[10px] font-semibold text-leather"
                  >
                    Lv {char.level}
                  </Badge>
                </div>
                <div className="mt-0.5 line-clamp-1 text-xs font-medium text-leather/70">
                  {[raceLabel(char), classLabel(char)].filter(Boolean).join(" · ") ||
                    "Unfinished"}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );

  const rightPage = selected ? (
    <CharacterDetail
      character={selected}
      onOpenFull={() =>
        router.push(`/campaign/${campaignId}/characters/${selected.id}`)
      }
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
    </OpenBookView>
  );
}

function CharacterDetail({
  character,
  onOpenFull,
}: {
  character: Character;
  onOpenFull: () => void;
}) {
  const race = raceLabel(character);
  const klass = classLabel(character);
  const hpPercent =
    character.hp_max != null && character.hp_current != null
      ? (character.hp_current / character.hp_max) * 100
      : null;

  return (
    <div className="scrollbar-none flex h-full flex-col gap-3 overflow-y-auto pr-1">
      <div className="flex items-start gap-3">
        {character.portrait_url && (
          <Image
            src={character.portrait_url}
            alt=""
            width={80}
            height={80}
            className="shrink-0 rounded-md border border-leather/40 object-cover shadow"
          />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-base uppercase tracking-[0.12em] text-leather sm:text-lg">
            {character.name}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              className="border-leather/40 text-[11px] font-semibold uppercase text-leather"
            >
              Level {character.level}
            </Badge>
            {race && (
              <Badge
                variant="outline"
                className="border-leather/40 text-[11px] font-semibold uppercase text-leather"
              >
                {race}
              </Badge>
            )}
            {klass && (
              <Badge
                variant="outline"
                className="border-leather/40 text-[11px] font-semibold uppercase text-leather"
              >
                {klass}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {hpPercent != null && (
        <div className="flex items-center gap-2 text-sm text-leather">
          <Heart className={cn("size-4", hpColor(hpPercent))} />
          <span className="font-mono font-semibold">
            {character.hp_current} / {character.hp_max} HP
          </span>
        </div>
      )}

      <button
        onClick={onOpenFull}
        className="mt-2 inline-flex items-center gap-1 font-subheading text-xs font-semibold uppercase tracking-[0.15em] text-leather/85 transition hover:text-leather"
      >
        Open character sheet
        <ChevronRight className="size-3.5" />
      </button>
    </div>
  );
}
