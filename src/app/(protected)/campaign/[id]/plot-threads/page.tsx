import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { PlotThreadList } from "./plot-thread-list";

export default async function PlotThreadsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { id: userId } = await requireUser();
  const supabase = await createClient();

  const [{ data: membership }, { data: campaign }, { data: plotThreads }] =
    await Promise.all([
      supabase
        .from("campaign_members").select("role")
        .eq("campaign_id", id).eq("user_id", userId).is("deleted_at", null).single(),
      supabase
        .from("campaigns").select("id, name").eq("id", id).is("deleted_at", null).single(),
      supabase
        .from("plot_threads")
        .select("id, title, description, status, priority, resolution_notes, gm_notes, gm_only")
        .eq("campaign_id", id).is("deleted_at", null).order("priority").order("title"),
    ]);

  if (!membership) notFound();
  if (!campaign) notFound();

  return <PlotThreadList campaignId={id} campaignName={campaign.name} plotThreads={plotThreads ?? []} role={membership.role} userId={userId} />;
}
