import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { NpcList } from "./npc-list";

export default async function NpcsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { id: userId } = await requireUser();
  const supabase = await createClient();

  const [{ data: membership }, { data: campaign }, { data: npcs }] =
    await Promise.all([
      supabase
        .from("campaign_members").select("role")
        .eq("campaign_id", id).eq("user_id", userId).is("deleted_at", null).single(),
      supabase
        .from("campaigns").select("id, name")
        .eq("id", id).is("deleted_at", null).single(),
      supabase
        .from("npcs")
        .select("id, name, aliases, description, status, tags, gm_only, portrait_url, gm_notes, player_notes, last_location_id")
        .eq("campaign_id", id).is("deleted_at", null).order("name"),
    ]);

  if (!membership) notFound();
  if (!campaign) notFound();

  return (
    <NpcList
      campaignId={id}
      campaignName={campaign.name}
      npcs={npcs ?? []}
      role={membership.role}
      userId={userId}
    />
  );
}
