import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { FactionList } from "./faction-list";

export default async function FactionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { id: userId } = await requireUser();
  const supabase = await createClient();

  const [{ data: membership }, { data: campaign }, { data: factions }] =
    await Promise.all([
      supabase
        .from("campaign_members").select("role")
        .eq("campaign_id", id).eq("user_id", userId).is("deleted_at", null).single(),
      supabase
        .from("campaigns").select("id, name").eq("id", id).is("deleted_at", null).single(),
      supabase
        .from("factions")
        .select("id, name, description, goals, gm_notes, player_notes, gm_only")
        .eq("campaign_id", id).is("deleted_at", null).order("name"),
    ]);

  if (!membership) notFound();
  if (!campaign) notFound();

  return <FactionList campaignId={id} campaignName={campaign.name} factions={factions ?? []} role={membership.role} userId={userId} />;
}
