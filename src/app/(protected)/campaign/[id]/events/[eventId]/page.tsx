import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { EventDetail } from "../event-detail";

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string; eventId: string }>;
}) {
  const { id, eventId } = await params;
  const { id: userId } = await requireUser();
  const supabase = await createClient();

  const [{ data: membership }, { data: campaign }, { data: event }, { data: eventEntities }, { count: childrenCount }] =
    await Promise.all([
      supabase
        .from("campaign_members").select("role")
        .eq("campaign_id", id).eq("user_id", userId).is("deleted_at", null).single(),
      supabase
        .from("campaigns").select("id, name")
        .eq("id", id).is("deleted_at", null).single(),
      supabase
        .from("campaign_events")
        .select("id, session_id, parent_id, content, summary, weight, event_type, narrative_day, narrative_time, sequence, resolved, trigger_condition, gm_only, created_at")
        .eq("id", eventId).eq("campaign_id", id).is("deleted_at", null).single(),
      supabase
        .from("campaign_event_entities")
        .select("entity_type, entity_id, role")
        .eq("event_id", eventId),
      supabase
        .from("campaign_events")
        .select("id", { count: "exact", head: true })
        .eq("parent_id", eventId)
        .is("deleted_at", null),
    ]);

  if (!membership) notFound();
  if (!campaign) notFound();
  if (!event) notFound();

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

  return (
    <EventDetail
      campaignId={id}
      campaignName={campaign.name}
      event={{ ...event, entity_tags: entityTags, children_count: childrenCount ?? 0 }}
      role={membership.role}
    />
  );
}
