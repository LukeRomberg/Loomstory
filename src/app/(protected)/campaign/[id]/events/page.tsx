import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventList } from "./event-list";

export default async function EventsPage({
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

  const { data: events } = await supabase
    .from("campaign_events")
    .select("id, session_id, content, summary, weight, event_type, narrative_day, narrative_time, sequence, resolved, trigger_condition, gm_only, created_at")
    .eq("campaign_id", id)
    .is("deleted_at", null)
    .order("narrative_day", { ascending: true, nullsFirst: false })
    .order("narrative_time", { ascending: true, nullsFirst: false })
    .order("sequence", { ascending: true });

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, title, session_number")
    .eq("campaign_id", id)
    .is("deleted_at", null)
    .order("session_number", { ascending: true });

  return (
    <EventList
      campaignId={id}
      campaignName={campaign.name}
      events={events ?? []}
      sessions={sessions ?? []}
      role={membership.role}
    />
  );
}
