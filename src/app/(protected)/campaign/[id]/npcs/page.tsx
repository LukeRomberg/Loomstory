import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NpcList } from "./npc-list";

export default async function NpcsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: npcs } = await supabase
    .from("npcs")
    .select("id, name, aliases, description, status, tags, gm_only, portrait_url")
    .eq("campaign_id", id).is("deleted_at", null).order("name");

  return (
    <NpcList
      campaignId={id}
      campaignName={campaign.name}
      npcs={npcs ?? []}
      role={membership.role}
      userId={user.id}
    />
  );
}
