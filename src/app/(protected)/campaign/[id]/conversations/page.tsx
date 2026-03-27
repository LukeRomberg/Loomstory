import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConversationList } from "./conversation-list";

export default async function ConversationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("campaign_members").select("role")
    .eq("campaign_id", id).eq("user_id", user.id).is("deleted_at", null).single();
  if (!membership) notFound();

  const { data: campaign } = await supabase
    .from("campaigns").select("id, name")
    .eq("id", id).is("deleted_at", null).single();
  if (!campaign) notFound();

  const { data: conversations } = await supabase
    .from("conversation_logs")
    .select("id, session_id, event_id, title, participants, content, content_plain, gm_notes, gm_only, created_at")
    .eq("campaign_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, title, session_number")
    .eq("campaign_id", id)
    .is("deleted_at", null)
    .order("session_number", { ascending: true });

  return (
    <ConversationList
      campaignId={id}
      campaignName={campaign.name}
      conversations={conversations ?? []}
      sessions={sessions ?? []}
      role={membership.role}
    />
  );
}
