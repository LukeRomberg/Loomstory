import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { anthropic } from "@/lib/ai/claude";
import { generateEmbeddings } from "@/lib/ai/embeddings";
import { buildRagPrompt } from "@/lib/ai/rag-query";

export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { campaign_id, user_id, question, role } = await request.json();

    if (!campaign_id || !user_id || !question) {
      return NextResponse.json(
        { error: "Missing campaign_id, user_id, or question" },
        { status: 400 }
      );
    }

    const isGm = role === "gm";

    // 1. Embed the question
    const [questionEmbedding] = await generateEmbeddings([question]);

    // 2. Search pgvector for relevant chunks
    const embeddingStr = `[${questionEmbedding.join(",")}]`;

    let query = supabase.rpc("match_embeddings", {
      query_embedding: embeddingStr,
      match_campaign_id: campaign_id,
      match_threshold: 0.3,
      match_count: 10,
    });

    // Players can only see non-gm_only content
    if (!isGm) {
      // The RPC should handle this, but as belt-and-suspenders
      // we'll filter after retrieval
    }

    const { data: matches, error: searchError } = await query;

    if (searchError) {
      console.error("Vector search error:", searchError);
      // Fall back to no context rather than failing
    }

    // Filter gm_only for players
    let chunks = (matches ?? []).map((m: { chunk_text: string; entity_type: string; entity_id: string; gm_only: boolean }) => ({
      chunk_text: m.chunk_text,
      entity_type: m.entity_type,
      entity_id: m.entity_id,
      gm_only: m.gm_only,
    }));

    if (!isGm) {
      chunks = chunks.filter((c: { gm_only: boolean }) => !c.gm_only);
    }

    // 3. Build prompt
    const { systemMessage, userMessage } = buildRagPrompt(question, chunks);

    // 4. Call Claude
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      system: systemMessage,
      messages: [{ role: "user", content: userMessage }],
    });

    const answer =
      response.content[0].type === "text" ? response.content[0].text : "";

    // 5. Build source references (deduplicated by entity)
    const ENTITY_TABLES: Record<string, string> = {
      npc: "npcs", location: "locations", faction: "factions",
      item: "items", plot_thread: "plot_threads", lore_entry: "lore_entries",
      event: "campaign_events", conversation: "conversation_logs",
    };

    const seenEntities = new Set<string>();
    const sources: { entity_type: string; entity_id: string; name: string; chunk: string }[] = [];

    for (const chunk of chunks) {
      const key = `${chunk.entity_type}:${chunk.entity_id}`;
      if (seenEntities.has(key)) continue;
      seenEntities.add(key);

      const table = ENTITY_TABLES[chunk.entity_type];
      let name = "Unknown";
      if (table) {
        const { data: entity } = await supabase
          .from(table)
          .select("name, title")
          .eq("id", chunk.entity_id)
          .single();
        name = entity?.name ?? entity?.title ?? "Unknown";
      }

      sources.push({
        entity_type: chunk.entity_type,
        entity_id: chunk.entity_id,
        name,
        chunk: chunk.chunk_text.slice(0, 200),
      });
    }

    // 6. Log interaction
    await supabase.from("ai_interactions").insert({
      campaign_id,
      user_id,
      context_type: "query",
      prompt: question,
      response: answer.slice(0, 10000),
      provider: "anthropic",
      model: "claude-haiku-4-5-20251001",
      input_tokens: response.usage?.input_tokens,
      output_tokens: response.usage?.output_tokens,
    });

    return NextResponse.json({ answer, sources });
  } catch (error) {
    console.error("AI query error:", error);
    return NextResponse.json(
      { error: "Failed to process question" },
      { status: 500 }
    );
  }
}
