import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NpcDetail } from "../npc-detail";

export default async function NpcPage({
  params,
}: {
  params: Promise<{ id: string; npcId: string }>;
}) {
  const { id, npcId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("campaign_members").select("role")
    .eq("campaign_id", id).eq("user_id", user.id).is("deleted_at", null).single();
  if (!membership) notFound();

  const { data: campaign } = await supabase
    .from("campaigns").select("id, name")
    .eq("id", id).is("deleted_at", null).single();
  if (!campaign) notFound();

  const { data: npc } = await supabase
    .from("npcs")
    .select("id, name, aliases, description, status, tags, portrait_url, gm_notes, player_notes, gm_only, last_location_id")
    .eq("id", npcId).eq("campaign_id", id).is("deleted_at", null).single();
  if (!npc) notFound();

  return (
    <NpcDetail
      campaignId={id}
      campaignName={campaign.name}
      npc={npc}
      role={membership.role}
    />
  );
}
