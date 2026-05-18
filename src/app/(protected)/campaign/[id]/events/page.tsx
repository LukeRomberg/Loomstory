import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { EventList } from "./event-list";

const ENTITY_TABLES: Record<string, string> = {
  npc: "npcs",
  location: "locations",
  faction: "factions",
  item: "items",
};

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
      .select("id, session_id, parent_id, content, summary, weight, event_type, narrative_day, narrative_time, sequence, resolved, trigger_condition, gm_only, created_at")
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

  const eventList = events ?? [];
  const eventIds = eventList.map((e) => e.id);

  // Fetch entity tags for all events in one query
  const { data: links } = eventIds.length
    ? await supabase
        .from("campaign_event_entities")
        .select("event_id, entity_type, entity_id, role")
        .in("event_id", eventIds)
    : { data: [] as { event_id: string; entity_type: string; entity_id: string; role: string }[] };

  // Resolve entity names per type (one query per entity table)
  const idsByType: Record<string, Set<string>> = {};
  for (const link of links ?? []) {
    if (!idsByType[link.entity_type]) idsByType[link.entity_type] = new Set();
    idsByType[link.entity_type].add(link.entity_id);
  }
  const namesByType: Record<string, Record<string, string>> = {};
  await Promise.all(
    Object.entries(idsByType).map(async ([type, ids]) => {
      const table = ENTITY_TABLES[type];
      if (!table) return;
      const { data } = await supabase
        .from(table)
        .select("id, name")
        .in("id", Array.from(ids));
      namesByType[type] = {};
      for (const row of data ?? []) namesByType[type][row.id] = row.name;
    })
  );

  // Group tags by event
  const tagsByEvent: Record<string, { entity_type: string; entity_id: string; entity_name: string; role: string }[]> = {};
  for (const link of links ?? []) {
    if (!tagsByEvent[link.event_id]) tagsByEvent[link.event_id] = [];
    tagsByEvent[link.event_id].push({
      entity_type: link.entity_type,
      entity_id: link.entity_id,
      entity_name: namesByType[link.entity_type]?.[link.entity_id] ?? "Unknown",
      role: link.role,
    });
  }

  // Children counts derived client-side from the events list
  const childrenCount: Record<string, number> = {};
  for (const e of eventList) {
    if (e.parent_id) childrenCount[e.parent_id] = (childrenCount[e.parent_id] ?? 0) + 1;
  }

  const enriched = eventList.map((e) => ({
    ...e,
    entity_tags: tagsByEvent[e.id] ?? [],
    children_count: childrenCount[e.id] ?? 0,
  }));

  return (
    <EventList
      campaignId={id}
      campaignName={campaign.name}
      events={enriched}
      sessions={sessions ?? []}
      role={membership.role}
      userId={userId}
    />
  );
}
