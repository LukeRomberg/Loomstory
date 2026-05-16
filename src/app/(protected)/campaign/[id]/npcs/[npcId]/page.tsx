import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { NpcDetail } from "../npc-detail";

export default async function NpcPage({
  params,
}: {
  params: Promise<{ id: string; npcId: string }>;
}) {
  const { id, npcId } = await params;
  const { id: userId } = await requireUser();
  const supabase = await createClient();

  const [{ data: membership }, { data: campaign }, { data: npc }] =
    await Promise.all([
      supabase
        .from("campaign_members").select("role")
        .eq("campaign_id", id).eq("user_id", userId).is("deleted_at", null).single(),
      supabase
        .from("campaigns").select("id, name")
        .eq("id", id).is("deleted_at", null).single(),
      supabase
        .from("npcs")
        .select("id, name, aliases, description, status, tags, portrait_url, gm_notes, player_notes, gm_only, last_location_id")
        .eq("id", npcId).eq("campaign_id", id).is("deleted_at", null).single(),
    ]);

  if (!membership) notFound();
  if (!campaign) notFound();
  if (!npc) notFound();

  return (
    <NpcDetail
      campaignId={id}
      campaignName={campaign.name}
      npc={npc}
      role={membership.role}
      userId={userId}
    />
  );
}
