import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CampaignSettings } from "./campaign-settings";
import { InviteManager } from "./invite-manager";
import { PlayerList } from "./player-list";

export default async function CampaignSettingsPage({
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

  // Verify GM access
  const { data: membership } = await supabase
    .from("campaign_members")
    .select("role")
    .eq("campaign_id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!membership || membership.role !== "gm") notFound();

  // Fetch campaign
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, name, description, system_id, house_rules, cover_image_url")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!campaign) notFound();

  // Fetch systems
  const { data: systems } = await supabase
    .from("systems")
    .select("id, name, slug")
    .order("name");

  // Fetch pending invites
  const { data: invites } = await supabase
    .from("campaign_invites")
    .select("*")
    .eq("campaign_id", id)
    .is("accepted_at", null)
    .order("created_at", { ascending: false });

  // Fetch campaign members with profiles
  const { data: members } = await supabase
    .from("campaign_members")
    .select("id, campaign_id, user_id, role, joined_at, profiles(id, display_name, avatar_url)")
    .eq("campaign_id", id)
    .is("deleted_at", null)
    .order("joined_at");

  return (
    <>
      <CampaignSettings campaign={campaign} systems={systems ?? []} />
      <div className="max-w-2xl mt-6 space-y-6">
        <PlayerList
          campaignId={id}
          members={members ?? []}
          currentUserId={user.id}
        />
        <InviteManager
          campaignId={id}
          invites={invites ?? []}
          userId={user.id}
        />
      </div>
    </>
  );
}
