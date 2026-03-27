import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const { user_id, campaign_id, accepted_entities, accepted_events, accepted_conversations } =
    await request.json();

  if (!user_id || !campaign_id) {
    return NextResponse.json(
      { error: "Missing user_id or campaign_id" },
      { status: 400 }
    );
  }

  try {
    // Commit via the RPC
    const { data, error } = await supabase.rpc("commit_extraction", {
      p_session_id: sessionId,
      p_extraction_id: null as unknown as string, // We'll mark all as committed below
      p_user_id: user_id,
      p_new_npcs: JSON.stringify(accepted_entities?.new_npcs ?? []),
      p_new_locations: JSON.stringify(accepted_entities?.new_locations ?? []),
      p_new_factions: JSON.stringify(accepted_entities?.new_factions ?? []),
      p_new_items: JSON.stringify(accepted_entities?.new_items ?? []),
      p_new_events: JSON.stringify(accepted_events ?? []),
      p_new_conversations: JSON.stringify(accepted_conversations ?? []),
      p_entity_mentions: JSON.stringify([]),
    });

    if (error) {
      console.error("RPC commit error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Mark all extractions as committed
    await supabase
      .from("session_extractions")
      .update({
        status: "committed",
        reviewed_by: user_id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("session_id", sessionId)
      .eq("status", "pending");

    // Update session status
    await supabase
      .from("sessions")
      .update({ status: "processed" })
      .eq("id", sessionId);

    return NextResponse.json({ success: true, committed: data });
  } catch (err) {
    console.error("Confirm error:", err);
    return NextResponse.json(
      { error: "Failed to commit extractions" },
      { status: 500 }
    );
  }
}
