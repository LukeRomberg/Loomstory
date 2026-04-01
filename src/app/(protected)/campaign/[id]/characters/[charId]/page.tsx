import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CharacterSheet } from "./character-sheet";
import type { Section } from "@/types/system-template";

export default async function CharacterPage({
  params,
}: {
  params: Promise<{ id: string; charId: string }>;
}) {
  const { id, charId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("campaign_members").select("role")
    .eq("campaign_id", id).eq("user_id", user.id).is("deleted_at", null).single();
  if (!membership) notFound();

  const { data: campaign } = await supabase
    .from("campaigns").select("id, name, system_id")
    .eq("id", id).is("deleted_at", null).single();
  if (!campaign) notFound();

  // Fetch character + all child table data in parallel
  const [charResult, statsResult, abilitiesResult, resourcesResult, itemsResult, notesResult, conditionsResult, templateResult] = await Promise.all([
    supabase.from("characters").select("*").eq("id", charId).is("deleted_at", null).single(),
    supabase.from("character_stats").select("*").eq("character_id", charId),
    supabase.from("character_abilities").select("*").eq("character_id", charId).order("ability_type").order("name"),
    supabase.from("character_resources").select("*").eq("character_id", charId),
    supabase.from("character_items").select("*").eq("character_id", charId).is("deleted_at", null).order("name"),
    supabase.from("character_notes").select("*").eq("character_id", charId).order("order_index"),
    supabase.from("character_conditions").select("*").eq("character_id", charId),
    campaign.system_id
      ? supabase.from("system_templates").select("sections").eq("system_id", campaign.system_id).single()
      : Promise.resolve({ data: null }),
  ]);

  if (!charResult.data) notFound();

  const template = (templateResult.data?.sections ?? []) as Section[];

  return (
    <CharacterSheet
      character={charResult.data}
      campaignId={id}
      campaignName={campaign.name}
      role={membership.role}
      userId={user.id}
      template={template}
      stats={statsResult.data ?? []}
      abilities={abilitiesResult.data ?? []}
      resources={resourcesResult.data ?? []}
      items={itemsResult.data ?? []}
      notes={notesResult.data ?? []}
      conditions={conditionsResult.data ?? []}
    />
  );
}
