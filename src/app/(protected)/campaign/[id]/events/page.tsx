import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { EventList } from "./event-list";

export default async function EventsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { id: userId } = await requireUser();
  const supabase = await createClient();

  const [
    { data: membership },
    { data: campaign },
    { data: events },
    { data: sessions },
  ] = await Promise.all([
    supabase
      .from("campaign_members").select("role")
      .eq("campaign_id", id).eq("user_id", userId).is("deleted_at", null).single(),
    supabase
      .from("campaigns").select("id, name")
      .eq("id", id).is("deleted_at", null).single(),
    supabase
      .from("campaign_events")
      .select("id, session_id, content, summary, weight, event_type, narrative_day, narrative_time, sequence, resolved, trigger_condition, gm_only, created_at")
      .eq("campaign_id", id)
      .is("deleted_at", null)
      .order("narrative_day", { ascending: true, nullsFirst: false })
      .order("narrative_time", { ascending: true, nullsFirst: false })
      .order("sequence", { ascending: true }),
    supabase
      .from("sessions")
      .select("id, title, session_number")
      .eq("campaign_id", id)
      .is("deleted_at", null)
      .order("session_number", { ascending: true }),
  ]);

  if (!membership) notFound();
  if (!campaign) notFound();

  return (
    <EventList
      campaignId={id}
      campaignName={campaign.name}
      events={events ?? []}
      sessions={sessions ?? []}
      role={membership.role}
      userId={userId}
    />
  );
}
