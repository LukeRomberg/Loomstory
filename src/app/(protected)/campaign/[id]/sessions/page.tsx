import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { SessionList } from "./session-list";

export default async function SessionsPage({
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
    { data: sessions },
  ] = await Promise.all([
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
      .select("id, title, date_played, session_number, status, created_at")
      .eq("campaign_id", id)
      .is("deleted_at", null)
      .order("session_number", { ascending: false, nullsFirst: false })
      .order("date_played", { ascending: false, nullsFirst: false }),
  ]);

  if (!membership) notFound();
  if (!campaign) notFound();

  return (
    <SessionList
      campaignId={id}
      campaignName={campaign.name}
      sessions={sessions ?? []}
      role={membership.role}
      userId={userId}
    />
  );
}
