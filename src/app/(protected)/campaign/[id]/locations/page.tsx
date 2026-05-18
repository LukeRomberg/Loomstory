import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { LocationList } from "./location-list";

export default async function LocationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { id: userId } = await requireUser();
  const supabase = await createClient();

  const [{ data: membership }, { data: campaign }, { data: locations }] =
    await Promise.all([
      supabase
        .from("campaign_members").select("role")
        .eq("campaign_id", id).eq("user_id", userId).is("deleted_at", null).single(),
      supabase
        .from("campaigns").select("id, name").eq("id", id).is("deleted_at", null).single(),
      supabase
        .from("locations")
        .select("id, name, aliases, description, type, gm_notes, player_notes, gm_only")
        .eq("campaign_id", id).is("deleted_at", null).order("name"),
    ]);

  if (!membership) notFound();
  if (!campaign) notFound();

  return <LocationList campaignId={id} campaignName={campaign.name} locations={locations ?? []} role={membership.role} userId={userId} />;
}
