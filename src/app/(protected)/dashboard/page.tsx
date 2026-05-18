import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { CampaignSelectScreen } from "./campaign-select-screen";

export default async function DashboardPage() {
  const { id: userId } = await requireUser();
  const supabase = await createClient();

  const [{ data: memberships }, { data: systems }] = await Promise.all([
    supabase
      .from("campaign_members")
      .select("campaign_id, role")
      .eq("user_id", userId)
      .is("deleted_at", null),
    supabase.from("systems").select("id, name, slug").order("name"),
  ]);

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
    emblem: string | null;
    created_at: string;
    role: string;
  }[] = [];

  if (campaignIds.length > 0) {
    const { data } = await supabase
      .from("campaigns")
      .select("id, name, description, cover_image_url, system_id, emblem, created_at")
      .in("id", campaignIds)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    campaigns =
      data?.map((c) => ({
        ...c,
        role: roleMap.get(c.id) ?? "player",
      })) ?? [];
  }

  return (
    <CampaignSelectScreen
      campaigns={campaigns}
      systems={systems ?? []}
      userId={userId}
    />
  );
}
