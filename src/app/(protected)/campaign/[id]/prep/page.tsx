import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SessionPrep } from "@/components/loomstory/session-prep";

export default async function PrepPage({
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

  const { data: membership } = await supabase
    .from("campaign_members")
    .select("role")
    .eq("campaign_id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();
  if (!membership) notFound();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, name")
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (!campaign) notFound();

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, title, session_number")
    .eq("campaign_id", id)
    .is("deleted_at", null)
    .order("session_number", { ascending: false });

  return (
    <SessionPrep
      campaignId={id}
      campaignName={campaign.name}
      userId={user.id}
      role={membership.role}
      sessions={sessions ?? []}
    />
  );
}
