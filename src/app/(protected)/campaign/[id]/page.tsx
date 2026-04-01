import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CampaignDashboard } from "./campaign-dashboard";

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch campaign
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, name, description, system_id, house_rules, cover_image_url, created_by")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!campaign) notFound();

  // Fetch membership
  const { data: membership } = await supabase
    .from("campaign_members")
    .select("role")
    .eq("campaign_id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!membership) notFound();

  // Fetch system name
  const { data: system } = campaign.system_id
    ? await supabase
        .from("systems")
        .select("name, slug")
        .eq("id", campaign.system_id)
        .single()
    : { data: null };

  // Fetch recent sessions
  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, title, date_played, session_number, status")
    .eq("campaign_id", id)
    .is("deleted_at", null)
    .order("session_number", { ascending: false, nullsFirst: false })
    .order("date_played", { ascending: false, nullsFirst: false })
    .limit(5);

  // Count knowledge base entities
  const counts = await Promise.all([
    supabase.from("npcs").select("id", { count: "exact", head: true }).eq("campaign_id", id).is("deleted_at", null),
    supabase.from("locations").select("id", { count: "exact", head: true }).eq("campaign_id", id).is("deleted_at", null),
    supabase.from("factions").select("id", { count: "exact", head: true }).eq("campaign_id", id).is("deleted_at", null),
    supabase.from("campaign_events").select("id", { count: "exact", head: true }).eq("campaign_id", id).is("deleted_at", null),
    supabase.from("conversation_logs").select("id", { count: "exact", head: true }).eq("campaign_id", id).is("deleted_at", null),
    supabase.from("plot_threads").select("id", { count: "exact", head: true }).eq("campaign_id", id).is("deleted_at", null),
    supabase.from("items").select("id", { count: "exact", head: true }).eq("campaign_id", id).is("deleted_at", null),
    supabase.from("lore_entries").select("id", { count: "exact", head: true }).eq("campaign_id", id).is("deleted_at", null),
    supabase.from("characters").select("id", { count: "exact", head: true }).eq("campaign_id", id).is("deleted_at", null),
  ]);

  const entityCounts = {
    npcs: counts[0].count ?? 0,
    locations: counts[1].count ?? 0,
    factions: counts[2].count ?? 0,
    events: counts[3].count ?? 0,
    conversations: counts[4].count ?? 0,
    plotThreads: counts[5].count ?? 0,
    items: counts[6].count ?? 0,
    lore: counts[7].count ?? 0,
    characters: counts[8].count ?? 0,
  };

  return (
    <CampaignDashboard
      campaign={campaign}
      role={membership.role}
      systemName={system?.name ?? null}
      sessions={sessions ?? []}
      entityCounts={entityCounts}
      userId={user.id}
    />
  );
}
