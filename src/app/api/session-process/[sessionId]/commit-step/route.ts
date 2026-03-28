import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { embedEntity } from "@/lib/ai/embeddings";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const { step, items, campaign_id, user_id } = await request.json();

  if (!campaign_id || !user_id || !step || !Array.isArray(items)) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    const results: { id: string; name: string }[] = [];

    if (step === "npcs") {
      for (const item of items) {
        const { data, error } = await supabase
          .from("npcs")
          .insert({
            campaign_id,
            name: item.name,
            aliases: Array.isArray(item.aliases) ? item.aliases : [],
            description: item.description || null,
            status: item.status || "alive",
            tags: Array.isArray(item.tags) ? item.tags : [],
            gm_notes: item.gm_notes || null,
            player_notes: item.player_notes || null,
            gm_only: true,
            created_by: user_id,
            updated_by: user_id,
          })
          .select("id, name")
          .single();

        if (error) {
          console.error("NPC insert error:", error);
          continue;
        }
        if (data) results.push(data);

        // Create session mention
        await supabase.from("session_entity_mentions").insert({
          session_id: sessionId,
          entity_type: "npc",
          entity_id: data.id,
          mention_type: "introduced",
        });
      }
    }

    if (step === "locations") {
      for (const item of items) {
        const { data, error } = await supabase
          .from("locations")
          .insert({
            campaign_id,
            name: item.name,
            aliases: Array.isArray(item.aliases) ? item.aliases : [],
            description: item.description || null,
            type: item.type || null,
            gm_notes: item.gm_notes || null,
            player_notes: item.player_notes || null,
            gm_only: true,
            created_by: user_id,
            updated_by: user_id,
          })
          .select("id, name")
          .single();

        if (error) {
          console.error("Location insert error:", error);
          continue;
        }
        if (data) results.push(data);

        await supabase.from("session_entity_mentions").insert({
          session_id: sessionId,
          entity_type: "location",
          entity_id: data.id,
          mention_type: "introduced",
        });
      }
    }

    if (step === "factions") {
      for (const item of items) {
        const { data, error } = await supabase
          .from("factions")
          .insert({
            campaign_id,
            name: item.name,
            description: item.description || null,
            goals: item.goals || null,
            gm_notes: item.gm_notes || null,
            player_notes: item.player_notes || null,
            gm_only: true,
            created_by: user_id,
            updated_by: user_id,
          })
          .select("id, name")
          .single();

        if (error) {
          console.error("Faction insert error:", error);
          continue;
        }
        if (data) results.push(data);

        await supabase.from("session_entity_mentions").insert({
          session_id: sessionId,
          entity_type: "faction",
          entity_id: data.id,
          mention_type: "introduced",
        });
      }
    }

    if (step === "items") {
      for (const item of items) {
        const { data, error } = await supabase
          .from("items")
          .insert({
            campaign_id,
            name: item.name,
            description: item.description || null,
            type: item.type || null,
            mechanical_properties: item.mechanical_properties_text
              ? { description: item.mechanical_properties_text }
              : null,
            gm_notes: item.gm_notes || null,
            player_notes: item.player_notes || null,
            gm_only: true,
            created_by: user_id,
            updated_by: user_id,
          })
          .select("id, name")
          .single();

        if (error) {
          console.error("Item insert error:", error);
          continue;
        }
        if (data) results.push(data);

        await supabase.from("session_entity_mentions").insert({
          session_id: sessionId,
          entity_type: "item",
          entity_id: data.id,
          mention_type: "introduced",
        });
      }
    }

    if (step === "events") {
      for (const item of items) {
        const { data: event, error } = await supabase
          .from("campaign_events")
          .insert({
            campaign_id,
            session_id: sessionId,
            content: item.content || item.summary || "",
            summary: item.summary || null,
            weight: item.weight ?? 3,
            event_type: item.event_type || "general",
            narrative_day: item.narrative_day ?? null,
            narrative_time: item.narrative_time ? parseInt(String(item.narrative_time)) : null,
            resolved: item.resolved === "true" || item.resolved === true,
            trigger_condition: item.trigger_condition || null,
            gm_only: true,
            created_by: user_id,
            updated_by: user_id,
          })
          .select("id")
          .single();

        if (error) {
          console.error("Event insert error:", error);
          continue;
        }
        if (event) {
          results.push({ id: event.id, name: item.summary || item.content || "" });

          // Insert entity tags
          if (Array.isArray(item.entity_tags)) {
            for (const tag of item.entity_tags) {
              if (tag.entity_id && tag.entity_type) {
                await supabase.from("campaign_event_entities").insert({
                  event_id: event.id,
                  entity_type: tag.entity_type,
                  entity_id: tag.entity_id,
                  role: tag.role || "subject",
                });
              }
            }
          }
        }
      }
    }

    if (step === "conversations") {
      for (const item of items) {
        const turns = Array.isArray(item.turns) ? item.turns : [];
        const contentPlain = turns
          .map((t: { speaker: string; text: string }) => `${t.speaker}: ${t.text}`)
          .join("\n");

        const { data, error } = await supabase
          .from("conversation_logs")
          .insert({
            campaign_id,
            session_id: sessionId,
            title: item.title || item.summary || "Untitled conversation",
            participants: item.participants || [],
            content: turns,
            content_plain: contentPlain,
            gm_notes: item.gm_notes || null,
            gm_only: true,
            created_by: user_id,
          })
          .select("id")
          .single();

        if (error) {
          console.error("Conversation insert error:", error);
          continue;
        }
        if (data) results.push({ id: data.id, name: item.title || "" });
      }
    }

    // Trigger embeddings in the background (don't block response)
    const entityTypeMap: Record<string, string> = {
      npcs: "npc",
      locations: "location",
      factions: "faction",
      items: "item",
      events: "event",
      conversations: "conversation",
    };
    const embeddingEntityType = entityTypeMap[step];

    if (embeddingEntityType && results.length > 0) {
      // Fire and forget — embeddings happen async
      Promise.all(
        results.map((r) =>
          supabase
            .from(step === "events" ? "campaign_events" : step === "conversations" ? "conversation_logs" : step)
            .select("*")
            .eq("id", r.id)
            .single()
            .then(({ data: entity }) => {
              if (entity) {
                return embedEntity({
                  campaignId: campaign_id,
                  entityType: embeddingEntityType,
                  entityId: r.id,
                  data: entity,
                  gmOnly: entity.gm_only ?? true,
                  supabase: supabase as never,
                });
              }
            })
        )
      ).catch((err) => console.error("Background embedding error:", err));
    }

    return NextResponse.json({
      success: true,
      committed: results.length,
      results,
    });
  } catch (err) {
    console.error("Commit step error:", err);
    return NextResponse.json(
      { error: "Failed to commit step" },
      { status: 500 }
    );
  }
}
