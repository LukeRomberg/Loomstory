import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SessionDetail } from "./session-detail";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id, sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Verify membership
  const { data: membership } = await supabase
    .from("campaign_members")
    .select("role")
    .eq("campaign_id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!membership) notFound();

  // Fetch campaign name
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, name")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!campaign) notFound();

  // Fetch session
  const { data: session } = await supabase
    .from("sessions")
    .select(
      "id, title, date_played, session_number, raw_notes, ai_summary, gm_notes, player_summary, player_visible, status, created_by"
    )
    .eq("id", sessionId)
    .eq("campaign_id", id)
    .is("deleted_at", null)
    .single();

  if (!session) notFound();

  return (
    <SessionDetail
      campaignId={id}
      campaignName={campaign.name}
      session={session}
      role={membership.role}
      userId={user.id}
    />
  );
}
