import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FactionList } from "./faction-list";

export default async function FactionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("campaign_members").select("role")
    .eq("campaign_id", id).eq("user_id", user.id).is("deleted_at", null).single();
  if (!membership) notFound();

  const { data: campaign } = await supabase
    .from("campaigns").select("id, name").eq("id", id).is("deleted_at", null).single();
  if (!campaign) notFound();

  const { data: factions } = await supabase
    .from("factions")
    .select("id, name, description, goals, gm_only")
    .eq("campaign_id", id).is("deleted_at", null).order("name");

  return <FactionList campaignId={id} campaignName={campaign.name} factions={factions ?? []} role={membership.role} userId={user.id} />;
}
