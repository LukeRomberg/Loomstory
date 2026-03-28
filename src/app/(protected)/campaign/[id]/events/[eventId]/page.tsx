import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventDetail } from "../event-detail";

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string; eventId: string }>;
}) {
  const { id, eventId } = await params;
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

  const { data: event } = await supabase
    .from("campaign_events")
    .select("id, session_id, parent_id, content, summary, weight, event_type, narrative_day, narrative_time, sequence, resolved, trigger_condition, gm_only, created_at")
    .eq("id", eventId).eq("campaign_id", id).is("deleted_at", null).single();
  if (!event) notFound();

  // Fetch entity tags
  const { data: eventEntities } = await supabase
    .from("campaign_event_entities")
    .select("entity_type, entity_id, role")
    .eq("event_id", eventId);

  // Resolve entity names
  const entityTags = [];
  const TABLES: Record<string, string> = { npc: "npcs", location: "locations", faction: "factions", item: "items" };
  for (const ee of eventEntities ?? []) {
    const table = TABLES[ee.entity_type];
    if (table) {
      const { data: entity } = await supabase.from(table).select("name").eq("id", ee.entity_id).single();
      entityTags.push({ ...ee, entity_name: entity?.name ?? "Unknown" });
    }
  }

  // Count children
  const { count: childrenCount } = await supabase
    .from("campaign_events")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", eventId)
    .is("deleted_at", null);

  return (
    <EventDetail
      campaignId={id}
      campaignName={campaign.name}
      event={{ ...event, entity_tags: entityTags, children_count: childrenCount ?? 0 }}
      role={membership.role}
    />
  );
}
