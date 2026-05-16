import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CampaignDashboard } from "./campaign-dashboard";

export default async function CampaignPage({
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

  // Fetch campaign
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, name, description, system_id, house_rules, cover_image_url, created_by")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!campaign) notFound();

  // Fetch membership
  const { data: membership } = await supabase
    .from("campaign_members")
    .select("role")
    .eq("campaign_id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!membership) notFound();

  // Fetch system slug (needed for CharacterModal)
  const { data: system } = campaign.system_id
    ? await supabase
        .from("systems")
        .select("slug")
        .eq("id", campaign.system_id)
        .single()
    : { data: null };

  return (
    <CampaignDashboard
      campaign={campaign}
      role={membership.role}
      systemSlug={system?.slug ?? null}
      userId={user.id}
    />
  );
}
