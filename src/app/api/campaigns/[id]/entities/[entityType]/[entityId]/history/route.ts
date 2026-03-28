import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; entityType: string; entityId: string }> }
) {
  const { id, entityType, entityId } = await params;

  // Fetch events tagged to this entity
  const { data: eventEntities } = await supabase
    .from("campaign_event_entities")
    .select("event_id, role")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId);

  let events: unknown[] = [];
  if (eventEntities && eventEntities.length > 0) {
    const eventIds = eventEntities.map((ee) => ee.event_id);
    const roleMap = new Map(eventEntities.map((ee) => [ee.event_id, ee.role]));

    const { data: eventRows } = await supabase
      .from("campaign_events")
      .select(
        "id, content, summary, weight, event_type, narrative_day, narrative_time, resolved, created_at"
      )
      .eq("campaign_id", id)
      .is("deleted_at", null)
      .in("id", eventIds)
      .order("narrative_day", { ascending: true, nullsFirst: false })
      .order("narrative_time", { ascending: true, nullsFirst: false });

    events = (eventRows ?? []).map((e) => ({
      ...e,
      role: roleMap.get(e.id) ?? "subject",
    }));
  }

  // Fetch conversations where this entity is a participant
  const { data: allConversations } = await supabase
    .from("conversation_logs")
    .select("id, title, participants, content, created_at")
    .eq("campaign_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  const conversations = (allConversations ?? [])
    .filter((conv) => {
      const participants = conv.participants as { entity_id?: string; name: string; entity_type: string }[];
      return participants.some((p) => p.entity_id === entityId);
    })
    .map((conv) => ({
      id: conv.id,
      title: conv.title,
      participants: conv.participants,
      turn_count: Array.isArray(conv.content) ? conv.content.length : 0,
      created_at: conv.created_at,
    }));

  // Fetch session mentions
  const { data: mentions } = await supabase
    .from("session_entity_mentions")
    .select("session_id, mention_type, created_at")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId);

  let sessionMentions: unknown[] = [];
  if (mentions && mentions.length > 0) {
    const sessionIds = [...new Set(mentions.map((m) => m.session_id))];
    const { data: sessions } = await supabase
      .from("sessions")
      .select("id, title, session_number")
      .in("id", sessionIds)
      .is("deleted_at", null);

    const sessionMap = new Map(
      (sessions ?? []).map((s) => [s.id, s])
    );

    sessionMentions = mentions.map((m) => {
      const session = sessionMap.get(m.session_id);
      return {
        session_id: m.session_id,
        session_title: session?.title ?? "Unknown Session",
        session_number: session?.session_number ?? null,
        mention_type: m.mention_type,
        created_at: m.created_at,
      };
    });
  }

  return NextResponse.json({
    events,
    conversations,
    session_mentions: sessionMentions,
  });
}
