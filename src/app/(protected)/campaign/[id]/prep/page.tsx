import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { SessionPrep } from "@/components/loomstory/session-prep";

export default async function PrepPage({
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
      .select("id, title, session_number")
      .eq("campaign_id", id)
      .is("deleted_at", null)
      .order("session_number", { ascending: false }),
  ]);

  if (!membership) notFound();
  if (!campaign) notFound();

  return (
    <SessionPrep
      campaignId={id}
      campaignName={campaign.name}
      userId={userId}
      role={membership.role}
      sessions={sessions ?? []}
    />
  );
}
