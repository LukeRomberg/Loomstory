import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { anthropic } from "@/lib/ai/claude";
import {
  buildUnresolvedPrompt,
  buildPlannerPrompt,
  buildHookPrompt,
  buildNpcEncounterPrompt,
  buildEncounterPrompt,
  buildLocationDressingPrompt,
  buildOutlinePrompt,
} from "@/lib/ai/prep-prompts";
import type {
  UnresolvedEvent,
  PlotThreadContext,
  NpcContext,
  LocationContext,
} from "@/lib/ai/prep-prompts";
import { generateEmbeddings } from "@/lib/ai/embeddings";
import { buildRagPrompt } from "@/lib/ai/rag-query";

export const maxDuration = 60;

const VALID_TOOLS = [
  "unresolved",
  "planner",
  "hooks",
  "npc-encounter",
  "encounter",
  "location-dressing",
  "outline",
] as const;

type PrepTool = (typeof VALID_TOOLS)[number];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { campaign_id, user_id, tool, input } = await request.json();

    if (!campaign_id || !user_id || !tool) {
      return NextResponse.json(
        { error: "Missing campaign_id, user_id, or tool" },
        { status: 400 }
      );
    }

    if (!VALID_TOOLS.includes(tool)) {
      return NextResponse.json(
        { error: `Invalid tool: ${tool}` },
        { status: 400 }
      );
    }

    // Verify GM membership
    const { data: membership } = await supabase
      .from("campaign_members")
      .select("role")
      .eq("campaign_id", campaign_id)
      .eq("user_id", user_id)
      .is("deleted_at", null)
      .single();

    if (!membership || membership.role !== "gm") {
      return NextResponse.json(
        { error: "Only GMs can use session prep tools" },
        { status: 403 }
      );
    }

    const { system, user } = await buildPromptForTool(
      tool as PrepTool,
      campaign_id,
      input
    );

    // Call Claude
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      system,
      messages: [{ role: "user", content: user }],
    });

    const content =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Log interaction
    await supabase.from("ai_interactions").insert({
      campaign_id,
      user_id,
      context_type: "prep",
      prompt: `[${tool}] ${user.slice(0, 5000)}`,
      response: content.slice(0, 10000),
      provider: "anthropic",
      model: "claude-haiku-4-5-20251001",
      input_tokens: response.usage?.input_tokens,
      output_tokens: response.usage?.output_tokens,
    });

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Session prep error:", error);
    return NextResponse.json(
      { error: "Failed to generate prep content" },
      { status: 500 }
    );
  }
}

// ─── Prompt building per tool ─────────────────────────────

async function buildPromptForTool(
  tool: PrepTool,
  campaignId: string,
  input?: { description?: string; npc_ids?: string[]; location_id?: string }
): Promise<{ system: string; user: string }> {
  switch (tool) {
    case "unresolved": {
      const events = await fetchUnresolvedEvents(campaignId);
      return buildUnresolvedPrompt(events);
    }

    case "planner": {
      const [threads, events] = await Promise.all([
        fetchActiveThreads(campaignId),
        fetchUnresolvedEvents(campaignId),
      ]);
      return buildPlannerPrompt(input?.description ?? "", threads, events);
    }

    case "hooks": {
      const [threads, events] = await Promise.all([
        fetchActiveThreads(campaignId),
        fetchUnresolvedEvents(campaignId),
      ]);
      return buildHookPrompt(threads, events);
    }

    case "npc-encounter": {
      const npcs = await fetchNpcContext(campaignId, input?.npc_ids);
      return buildNpcEncounterPrompt(input?.description ?? "", npcs);
    }

    case "encounter": {
      const lore = await fetchLoreContext(campaignId, input?.description ?? "");
      return buildEncounterPrompt(input?.description ?? "", lore);
    }

    case "location-dressing": {
      const location = await fetchLocationContext(
        campaignId,
        input?.location_id
      );
      if (!location) {
        return buildLocationDressingPrompt({
          id: "",
          name: "Unknown location",
          description: null,
          type: null,
          related_events: [],
        });
      }
      return buildLocationDressingPrompt(location);
    }

    case "outline": {
      const [threads, events, npcs] = await Promise.all([
        fetchActiveThreads(campaignId),
        fetchUnresolvedEvents(campaignId),
        fetchNpcContext(campaignId),
      ]);
      return buildOutlinePrompt(
        input?.description ?? "",
        threads,
        events,
        npcs
      );
    }
  }
}

// ─── Data fetchers ────────────────────────────────────────

async function fetchUnresolvedEvents(
  campaignId: string
): Promise<UnresolvedEvent[]> {
  const { data } = await supabase
    .from("campaign_events")
    .select(
      "id, content, summary, event_type, trigger_condition, narrative_day"
    )
    .eq("campaign_id", campaignId)
    .eq("resolved", false)
    .in("event_type", ["promise", "todo", "upcoming"])
    .is("deleted_at", null)
    .order("narrative_day", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  return data ?? [];
}

async function fetchActiveThreads(
  campaignId: string
): Promise<PlotThreadContext[]> {
  const { data } = await supabase
    .from("plot_threads")
    .select("id, title, description, status, priority")
    .eq("campaign_id", campaignId)
    .in("status", ["active", "on_hold"])
    .is("deleted_at", null)
    .order("priority", { ascending: true });

  return data ?? [];
}

async function fetchNpcContext(
  campaignId: string,
  npcIds?: string[]
): Promise<NpcContext[]> {
  let query = supabase
    .from("npcs")
    .select("id, name, description, personality, status")
    .eq("campaign_id", campaignId)
    .is("deleted_at", null);

  if (npcIds && npcIds.length > 0) {
    query = query.in("id", npcIds);
  } else {
    // Default: top 10 NPCs by most recent event involvement
    query = query.limit(10);
  }

  const { data: npcsData } = await query.order("name");
  if (!npcsData || npcsData.length === 0) return [];

  // Fetch recent events for each NPC
  const npcs: NpcContext[] = [];
  for (const npc of npcsData) {
    const { data: tags } = await supabase
      .from("event_entity_tags")
      .select("event_id")
      .eq("entity_type", "npc")
      .eq("entity_id", npc.id)
      .limit(5);

    let recentEvents: { content: string; event_type: string }[] = [];
    if (tags && tags.length > 0) {
      const eventIds = tags.map((t: { event_id: string }) => t.event_id);
      const { data: events } = await supabase
        .from("campaign_events")
        .select("content, event_type")
        .in("id", eventIds)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(5);
      recentEvents = events ?? [];
    }

    npcs.push({
      ...npc,
      recent_events: recentEvents,
    });
  }

  return npcs;
}

async function fetchLocationContext(
  campaignId: string,
  locationId?: string
): Promise<LocationContext | null> {
  if (!locationId) return null;

  const { data: loc } = await supabase
    .from("locations")
    .select("id, name, description, type")
    .eq("id", locationId)
    .eq("campaign_id", campaignId)
    .is("deleted_at", null)
    .single();

  if (!loc) return null;

  // Fetch events tagged to this location
  const { data: tags } = await supabase
    .from("event_entity_tags")
    .select("event_id")
    .eq("entity_type", "location")
    .eq("entity_id", locationId)
    .limit(10);

  let relatedEvents: { content: string; event_type: string }[] = [];
  if (tags && tags.length > 0) {
    const eventIds = tags.map((t: { event_id: string }) => t.event_id);
    const { data: events } = await supabase
      .from("campaign_events")
      .select("content, event_type")
      .in("id", eventIds)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(10);
    relatedEvents = events ?? [];
  }

  return {
    ...loc,
    related_events: relatedEvents,
  };
}

async function fetchLoreContext(
  campaignId: string,
  description: string
): Promise<string[]> {
  // Use RAG to find relevant campaign lore for the encounter
  try {
    const [embedding] = await generateEmbeddings([description]);
    const embeddingStr = `[${embedding.join(",")}]`;

    const { data: matches } = await supabase.rpc("match_embeddings", {
      query_embedding: embeddingStr,
      match_campaign_id: campaignId,
      match_threshold: 0.3,
      match_count: 5,
    });

    return (matches ?? []).map(
      (m: { chunk_text: string }) => m.chunk_text
    );
  } catch {
    return [];
  }
}
