import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { embedEntity } from "@/lib/ai/embeddings";

export const maxDuration = 300;

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
};

/**
 * POST /api/embeddings/backfill
 * Embeds all entities in a campaign that don't have embeddings yet.
 * Body: { campaign_id }
 */
export async function POST(request: Request) {
  try {
    const { campaign_id } = await request.json();

    if (!campaign_id) {
      return NextResponse.json({ error: "Missing campaign_id" }, { status: 400 });
    }

    let totalEmbedded = 0;
    const results: Record<string, number> = {};

    for (const [entityType, table] of Object.entries(ENTITY_TABLES)) {
      const { data: entities } = await supabase
        .from(table)
        .select("*")
        .eq("campaign_id", campaign_id)
        .is("deleted_at", null);

      if (!entities || entities.length === 0) {
        results[entityType] = 0;
        continue;
      }

      let count = 0;
      for (const entity of entities) {
        // Check if already embedded
        const { count: existingCount } = await supabase
          .from("embeddings")
          .select("id", { count: "exact", head: true })
          .eq("entity_type", entityType)
          .eq("entity_id", entity.id);

        if ((existingCount ?? 0) > 0) continue; // Skip already embedded

        try {
          const chunks = await embedEntity({
            campaignId: campaign_id,
            entityType,
            entityId: entity.id,
            data: entity,
            gmOnly: entity.gm_only ?? true,
            supabase: supabase as never,
          });
          count += chunks;
        } catch (err) {
          console.error(`Failed to embed ${entityType} ${entity.id}:`, err);
        }
      }

      results[entityType] = count;
      totalEmbedded += count;
    }

    return NextResponse.json({
      success: true,
      total_chunks: totalEmbedded,
      by_type: results,
    });
  } catch (error) {
    console.error("Backfill error:", error);
    return NextResponse.json(
      { error: "Backfill failed" },
      { status: 500 }
    );
  }
}
