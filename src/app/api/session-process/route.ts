import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { anthropic } from "@/lib/ai/claude";
import {
  buildEntityExtractionPrompt,
  buildEventExtractionPrompt,
  buildConversationExtractionPrompt,
  type EntityManifest,
} from "@/lib/ai/extraction-prompts";

export const maxDuration = 300;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fetchManifest(campaignId: string): Promise<EntityManifest> {
  const [npcs, locations, factions, items] = await Promise.all([
    supabase
      .from("npcs")
      .select("id, name, aliases")
      .eq("campaign_id", campaignId)
      .is("deleted_at", null),
    supabase
      .from("locations")
      .select("id, name, aliases")
      .eq("campaign_id", campaignId)
      .is("deleted_at", null),
    supabase
      .from("factions")
      .select("id, name")
      .eq("campaign_id", campaignId)
      .is("deleted_at", null),
    supabase
      .from("items")
      .select("id, name")
      .eq("campaign_id", campaignId)
      .is("deleted_at", null),
  ]);

  return {
    npcs: (npcs.data ?? []).map((n) => ({
      id: n.id,
      name: n.name,
      aliases: n.aliases ?? [],
    })),
    locations: (locations.data ?? []).map((l) => ({
      id: l.id,
      name: l.name,
      aliases: l.aliases ?? [],
    })),
    factions: (factions.data ?? []).map((f) => ({ id: f.id, name: f.name })),
    items: (items.data ?? []).map((i) => ({ id: i.id, name: i.name })),
  };
}

async function runPass(
  system: string,
  userMessage: string,
  passType: string
): Promise<Record<string, unknown>> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 16000,
    system,
    messages: [{ role: "user", content: userMessage }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Parse JSON — handle markdown fences just in case
  const cleaned = text
    .replace(/^```json?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    console.error(`Failed to parse ${passType} JSON:`, cleaned.slice(0, 500));
    return {};
  }
}

export async function POST(request: Request) {
  try {
    const { campaign_id, session_id, user_id } = await request.json();

    if (!campaign_id || !session_id || !user_id) {
      return NextResponse.json(
        { error: "Missing campaign_id, session_id, or user_id" },
        { status: 400 }
      );
    }

    // Fetch session notes
    const { data: session } = await supabase
      .from("sessions")
      .select("raw_notes, status")
      .eq("id", session_id)
      .single();

    if (!session?.raw_notes) {
      return NextResponse.json(
        { error: "No session notes to process" },
        { status: 400 }
      );
    }

    // Strip HTML tags to get plain text for the AI
    const plainNotes = session.raw_notes
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (plainNotes.length < 20) {
      return NextResponse.json(
        { error: "Session notes are too short to process" },
        { status: 400 }
      );
    }

    // Update session status to processing
    await supabase
      .from("sessions")
      .update({ status: "processing" })
      .eq("id", session_id);

    // Fetch entity manifest
    const manifest = await fetchManifest(campaign_id);

    // Run all 3 passes in parallel
    const entityPrompt = buildEntityExtractionPrompt(manifest);
    const eventPrompt = buildEventExtractionPrompt(manifest);
    const conversationPrompt = buildConversationExtractionPrompt(manifest);

    const [entityResult, eventResult, conversationResult] = await Promise.all([
      runPass(
        entityPrompt.system,
        entityPrompt.buildUser(plainNotes),
        "entities"
      ),
      runPass(
        eventPrompt.system,
        eventPrompt.buildUser(plainNotes),
        "events"
      ),
      runPass(
        conversationPrompt.system,
        conversationPrompt.buildUser(plainNotes),
        "conversations"
      ),
    ]);

    // Store extraction results
    const extractions = [
      {
        session_id,
        pass_type: "entities",
        extraction: entityResult,
        status: "pending",
      },
      {
        session_id,
        pass_type: "events",
        extraction: eventResult,
        status: "pending",
      },
      {
        session_id,
        pass_type: "conversations",
        extraction: conversationResult,
        status: "pending",
      },
    ];

    // Delete any prior extractions for this session
    await supabase
      .from("session_extractions")
      .delete()
      .eq("session_id", session_id);

    // Insert new extractions
    const { error: insertError } = await supabase
      .from("session_extractions")
      .insert(extractions);

    if (insertError) {
      console.error("Failed to save extractions:", insertError);
      await supabase
        .from("sessions")
        .update({ status: "draft" })
        .eq("id", session_id);
      return NextResponse.json(
        { error: "Failed to save extraction results" },
        { status: 500 }
      );
    }

    // Update session status to processed
    await supabase
      .from("sessions")
      .update({ status: "processed" })
      .eq("id", session_id);

    // Log AI interaction
    await supabase.from("ai_interactions").insert({
      campaign_id,
      user_id,
      context_type: "extraction",
      prompt: `3-pass extraction for session ${session_id} (${plainNotes.length} chars)`,
      response: JSON.stringify({
        entities: entityResult,
        events: eventResult,
        conversations: conversationResult,
      }).slice(0, 10000),
      provider: "anthropic",
      model: "claude-haiku-4-5-20251001",
    });

    // Count results for summary
    const summary = {
      npcs:
        ((entityResult.new_npcs as unknown[]) ?? []).length +
        ((entityResult.updated_entities as unknown[]) ?? []).length,
      locations: ((entityResult.new_locations as unknown[]) ?? []).length,
      factions: ((entityResult.new_factions as unknown[]) ?? []).length,
      items: ((entityResult.new_items as unknown[]) ?? []).length,
      events: ((eventResult.events as unknown[]) ?? []).length,
      conversations:
        ((conversationResult.conversations as unknown[]) ?? []).length,
    };

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error("Session processing error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during processing" },
      { status: 500 }
    );
  }
}
