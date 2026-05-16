import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { CampaignSettings } from "./campaign-settings";
import { InviteManager } from "./invite-manager";
import { PlayerList } from "./player-list";

export default async function CampaignSettingsPage({
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
    { data: systems },
    { data: invites },
    { data: rawMembers },
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
      .select("id, name, description, system_id, house_rules, cover_image_url")
      .eq("id", id)
      .is("deleted_at", null)
      .single(),
    supabase.from("systems").select("id, name, slug").order("name"),
    supabase
      .from("campaign_invites")
      .select("*")
      .eq("campaign_id", id)
      .is("accepted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("campaign_members")
      .select("id, campaign_id, user_id, role, joined_at, profiles(id, display_name, avatar_url)")
      .eq("campaign_id", id)
      .is("deleted_at", null)
      .order("joined_at"),
  ]);

  if (!membership || membership.role !== "gm") notFound();
  if (!campaign) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase returns joined profiles as array without generated types
  const members = (rawMembers ?? []).map((m: any) => ({
    ...m,
    profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles,
  }));

  return (
    <>
      <CampaignSettings campaign={campaign} systems={systems ?? []} />
      <div className="max-w-2xl mt-6 space-y-6">
        <PlayerList
          campaignId={id}
          members={members}
          currentUserId={userId}
        />
        <InviteManager
          campaignId={id}
          invites={invites ?? []}
          userId={userId}
        />
      </div>
    </>
  );
}
