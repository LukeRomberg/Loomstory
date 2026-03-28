import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { embedEntity } from "@/lib/ai/embeddings";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ENTITY_TABLES: Record<string, string> = {
  npc: "npcs",
  location: "locations",
  faction: "factions",
  plot_thread: "plot_threads",
  item: "items",
  lore_entry: "lore_entries",
  event: "campaign_events",
  conversation: "conversation_logs",
  session: "sessions",
};

/**
 * POST /api/embeddings
 * Embeds a single entity or batch of entities.
 * Body: { campaign_id, entities: [{ entity_type, entity_id }] }
 */
export async function POST(request: Request) {
  try {
    const { campaign_id, entities } = await request.json();

    if (!campaign_id || !Array.isArray(entities) || entities.length === 0) {
      return NextResponse.json(
        { error: "Missing campaign_id or entities array" },
        { status: 400 }
      );
    }

    let totalEmbedded = 0;

    for (const { entity_type, entity_id } of entities) {
      const table = ENTITY_TABLES[entity_type];
      if (!table) continue;

      // Fetch the entity data
      const { data: entity } = await supabase
        .from(table)
        .select("*")
        .eq("id", entity_id)
        .single();

      if (!entity) continue;

      const gmOnly = entity.gm_only ?? true;

      const count = await embedEntity({
        campaignId: campaign_id,
        entityType: entity_type,
        entityId: entity_id,
        data: entity,
        gmOnly,
        supabase: supabase as never,
      });

      totalEmbedded += count;
    }

    return NextResponse.json({ success: true, chunks_embedded: totalEmbedded });
  } catch (error) {
    console.error("Embedding error:", error);
    return NextResponse.json(
      { error: "Failed to generate embeddings" },
      { status: 500 }
    );
  }
}
