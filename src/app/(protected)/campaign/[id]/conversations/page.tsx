import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { ConversationList } from "./conversation-list";

export default async function ConversationsPage({
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
    { data: conversations },
    { data: sessions },
    npcs,
    characters,
  ] = await Promise.all([
    supabase
      .from("campaign_members").select("role")
      .eq("campaign_id", id).eq("user_id", userId).is("deleted_at", null).single(),
    supabase
      .from("campaigns").select("id, name")
      .eq("id", id).is("deleted_at", null).single(),
    supabase
      .from("conversation_logs")
      .select("id, session_id, event_id, title, participants, content, content_plain, gm_notes, gm_only, created_at")
      .eq("campaign_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("sessions")
      .select("id, title, session_number")
      .eq("campaign_id", id)
      .is("deleted_at", null)
      .order("session_number", { ascending: true }),
    supabase.from("npcs").select("id, name").eq("campaign_id", id).is("deleted_at", null).order("name"),
    supabase.from("characters").select("id, name").eq("campaign_id", id).is("deleted_at", null).order("name"),
  ]);

  if (!membership) notFound();
  if (!campaign) notFound();

  const knownEntities = [
    ...(npcs.data ?? []).map((n) => ({ id: n.id, name: n.name, entity_type: "npc" })),
    ...(characters.data ?? []).map((c) => ({ id: c.id, name: c.name, entity_type: "character" })),
  ];

  return (
    <ConversationList
      campaignId={id}
      campaignName={campaign.name}
      conversations={conversations ?? []}
      sessions={sessions ?? []}
      role={membership.role}
      userId={userId}
      knownEntities={knownEntities}
    />
  );
}
