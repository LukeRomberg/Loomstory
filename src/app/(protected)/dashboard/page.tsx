import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CampaignList } from "./campaign-list";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch campaigns where user is a member
  const { data: memberships } = await supabase
    .from("campaign_members")
    .select("campaign_id, role")
    .eq("user_id", user.id)
    .is("deleted_at", null);

  const campaignIds = memberships?.map((m) => m.campaign_id) ?? [];
  const roleMap = new Map(
    memberships?.map((m) => [m.campaign_id, m.role]) ?? []
  );

  let campaigns: {
    id: string;
    name: string;
    description: string | null;
    cover_image_url: string | null;
    system_id: string | null;
    created_at: string;
    role: string;
  }[] = [];

  if (campaignIds.length > 0) {
    const { data } = await supabase
      .from("campaigns")
      .select("id, name, description, cover_image_url, system_id, created_at")
      .in("id", campaignIds)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    campaigns =
      data?.map((c) => ({
        ...c,
        role: roleMap.get(c.id) ?? "player",
      })) ?? [];
  }

  // Fetch systems for the create dialog
  const { data: systems } = await supabase
    .from("systems")
    .select("id, name, slug")
    .order("name");

  return (
    <CampaignList
      campaigns={campaigns}
      systems={systems ?? []}
      userId={user.id}
    />
  );
}
