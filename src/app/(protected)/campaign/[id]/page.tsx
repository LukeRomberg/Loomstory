import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CampaignDashboard } from "./campaign-dashboard";
import type { TimelineEvent, TimelineEntity } from "@/components/loomstory/campaign-timeline";

const ENTITY_TABLES: Record<string, { table: string; nameCol: string }> = {
  npc: { table: "npcs", nameCol: "name" },
  location: { table: "locations", nameCol: "name" },
  faction: { table: "factions", nameCol: "name" },
  item: { table: "items", nameCol: "name" },
  character: { table: "characters", nameCol: "name" },
  plot_thread: { table: "plot_threads", nameCol: "title" },
  lore_entry: { table: "lore_entries", nameCol: "title" },
};

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

  // Fetch timeline events
  const isGm = membership.role === "gm";
  let eventsQuery = supabase
    .from("campaign_events")
    .select("id, summary, content, narrative_day, narrative_time, sequence, gm_only, event_type")
    .eq("campaign_id", id)
    .is("deleted_at", null)
    .not("narrative_day", "is", null)
    .order("narrative_day", { ascending: true })
    .order("narrative_time", { ascending: true, nullsFirst: true })
    .order("sequence", { ascending: true });

  if (!isGm) eventsQuery = eventsQuery.eq("gm_only", false);

  const { data: rawEvents } = await eventsQuery;
  const eventList = rawEvents ?? [];

  // Fetch entity tags for those events
  const eventIds = eventList.map((e) => e.id);
  const { data: tagRows } = eventIds.length
    ? await supabase
        .from("campaign_event_entities")
        .select("event_id, entity_type, entity_id")
        .in("event_id", eventIds)
    : { data: [] as Array<{ event_id: string; entity_type: string; entity_id: string }> };

  const tagsByEvent = new Map<string, Array<{ entity_type: string; entity_id: string }>>();
  const idsByType = new Map<string, Set<string>>();
  for (const row of tagRows ?? []) {
    if (!tagsByEvent.has(row.event_id)) tagsByEvent.set(row.event_id, []);
    tagsByEvent.get(row.event_id)!.push({ entity_type: row.entity_type, entity_id: row.entity_id });
    if (!idsByType.has(row.entity_type)) idsByType.set(row.entity_type, new Set());
    idsByType.get(row.entity_type)!.add(row.entity_id);
  }

  // Resolve names per entity type
  const nameLookup = new Map<string, string>();
  await Promise.all(
    Array.from(idsByType.entries()).map(async ([entityType, ids]) => {
      const config = ENTITY_TABLES[entityType];
      if (!config) return;
      const { data: rows } = await supabase
        .from(config.table)
        .select(`id, ${config.nameCol}`)
        .in("id", Array.from(ids))
        .is("deleted_at", null);
      for (const row of (rows ?? []) as unknown as Array<Record<string, unknown>>) {
        const rowId = row.id as string;
        const rowName = row[config.nameCol] as string;
        nameLookup.set(`${entityType}:${rowId}`, rowName);
      }
    })
  );

  const timelineEvents: TimelineEvent[] = eventList.map((e) => {
    const entityRefs = tagsByEvent.get(e.id) ?? [];
    const entities: TimelineEntity[] = entityRefs
      .map((ref) => {
        const name = nameLookup.get(`${ref.entity_type}:${ref.entity_id}`);
        return name ? { entity_type: ref.entity_type, entity_id: ref.entity_id, name } : null;
      })
      .filter((x): x is TimelineEntity => x !== null);
    const titleText =
      (e.summary && e.summary.trim().length > 0 ? e.summary : e.content) ?? "";
    return {
      id: e.id,
      title: titleText.length > 120 ? `${titleText.slice(0, 117)}…` : titleText,
      narrative_day: e.narrative_day,
      narrative_time: e.narrative_time,
      sequence: e.sequence ?? 0,
      gm_only: e.gm_only,
      event_type: e.event_type,
      entities,
    };
  });

  return (
    <CampaignDashboard
      campaign={campaign}
      role={membership.role}
      systemName={system?.name ?? null}
      systemSlug={system?.slug ?? null}
      sessions={sessions ?? []}
      entityCounts={entityCounts}
      userId={user.id}
      timelineEvents={timelineEvents}
    />
  );
}
