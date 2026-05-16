import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { SessionDetail } from "./session-detail";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id, sessionId } = await params;
  const { id: userId } = await requireUser();
  const supabase = await createClient();

  const [{ data: membership }, { data: campaign }, { data: session }] =
    await Promise.all([
      supabase
        .from("campaign_members")
        .select("role")
        .eq("campaign_id", id)
        .eq("user_id", userId)
        .is("deleted_at", null)
        .single(),
      supabase
        .from("campaigns")
        .select("id, name")
        .eq("id", id)
        .is("deleted_at", null)
        .single(),
      supabase
        .from("sessions")
        .select(
          "id, title, date_played, session_number, raw_notes, ai_summary, gm_notes, player_summary, player_visible, status, created_by"
        )
        .eq("id", sessionId)
        .eq("campaign_id", id)
        .is("deleted_at", null)
        .single(),
    ]);

  if (!membership) notFound();
  if (!campaign) notFound();
  if (!session) notFound();

  return (
    <SessionDetail
      campaignId={id}
      campaignName={campaign.name}
      session={session}
      role={membership.role}
      userId={userId}
    />
  );
}
