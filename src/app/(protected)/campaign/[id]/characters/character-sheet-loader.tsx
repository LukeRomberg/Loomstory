"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CharacterSheet } from "./character-sheet";
import { Loader2 } from "lucide-react";
import type { Section } from "@/types/system-template";

interface CharacterRow {
  id: string;
  campaign_id: string;
  name: string;
  level: number;
  experience: number;
  hp_current: number | null;
  hp_max: number | null;
  system_id: string;
  user_id: string | null;
  portrait_url: string | null;
  gm_notes: string | null;
  data: Record<string, unknown>;
}

interface CharacterSheetLoaderProps {
  characterId: string;
  campaignId: string;
  systemId: string | null;
  role: string;
  userId: string;
}

// Fetches all child-table rows (stats, abilities, resources, items, notes,
// conditions) plus the system template for a single character, then renders
// the embedded CharacterSheet. Used by the inline character right-page view.
export function CharacterSheetLoader({
  characterId,
  campaignId,
  systemId,
  role,
  userId,
}: CharacterSheetLoaderProps) {
  const [loading, setLoading] = useState(true);
  const [character, setCharacter] = useState<CharacterRow | null>(null);
  const [template, setTemplate] = useState<Section[]>([]);
  const [stats, setStats] = useState<unknown[]>([]);
  const [abilities, setAbilities] = useState<unknown[]>([]);
  const [resources, setResources] = useState<unknown[]>([]);
  const [items, setItems] = useState<unknown[]>([]);
  const [notes, setNotes] = useState<unknown[]>([]);
  const [conditions, setConditions] = useState<unknown[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const supabase = createClient();

    Promise.all([
      supabase
        .from("characters")
        .select("*")
        .eq("id", characterId)
        .is("deleted_at", null)
        .single(),
      supabase
        .from("character_stats")
        .select("*")
        .eq("character_id", characterId),
      supabase
        .from("character_abilities")
        .select("*")
        .eq("character_id", characterId)
        .order("ability_type")
        .order("name"),
      supabase
        .from("character_resources")
        .select("*")
        .eq("character_id", characterId),
      supabase
        .from("character_items")
        .select("*")
        .eq("character_id", characterId)
        .is("deleted_at", null)
        .order("name"),
      supabase
        .from("character_notes")
        .select("*")
        .eq("character_id", characterId)
        .order("order_index"),
      supabase
        .from("character_conditions")
        .select("*")
        .eq("character_id", characterId),
      systemId
        ? supabase
            .from("system_templates")
            .select("sections")
            .eq("system_id", systemId)
            .single()
        : Promise.resolve({ data: null }),
    ]).then(
      ([
        charRes,
        statsRes,
        abilitiesRes,
        resourcesRes,
        itemsRes,
        notesRes,
        conditionsRes,
        templateRes,
      ]) => {
        if (cancelled) return;
        setCharacter((charRes.data ?? null) as CharacterRow | null);
        setStats(statsRes.data ?? []);
        setAbilities(abilitiesRes.data ?? []);
        setResources(resourcesRes.data ?? []);
        setItems(itemsRes.data ?? []);
        setNotes(notesRes.data ?? []);
        setConditions(conditionsRes.data ?? []);
        setTemplate(
          ((templateRes.data as { sections?: Section[] } | null)?.sections ??
            []) as Section[]
        );
        setLoading(false);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [characterId, systemId]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-leather/70">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (!character) {
    return (
      <div className="flex h-full items-center justify-center text-xs italic text-leather/60">
        Character not found.
      </div>
    );
  }

  return (
    <CharacterSheet
      character={character}
      campaignId={campaignId}
      role={role}
      userId={userId}
      template={template}
      stats={stats as never[]}
      abilities={abilities}
      resources={resources as never[]}
      items={items}
      notes={notes as never[]}
      conditions={conditions}
    />
  );
}
