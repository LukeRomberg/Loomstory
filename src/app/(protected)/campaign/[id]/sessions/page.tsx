import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SessionList } from "./session-list";

export default async function SessionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  // Fetch all sessions
  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, title, date_played, session_number, status, created_at")
    .eq("campaign_id", id)
    .is("deleted_at", null)
    .order("session_number", { ascending: false, nullsFirst: false })
    .order("date_played", { ascending: false, nullsFirst: false });

  return (
    <SessionList
      campaignId={id}
      campaignName={campaign.name}
      sessions={sessions ?? []}
      role={membership.role}
      userId={user.id}
    />
  );
}
