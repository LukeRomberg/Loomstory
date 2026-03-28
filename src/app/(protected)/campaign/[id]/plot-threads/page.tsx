import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlotThreadList } from "./plot-thread-list";

export default async function PlotThreadsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("campaign_members").select("role")
    .eq("campaign_id", id).eq("user_id", user.id).is("deleted_at", null).single();
  if (!membership) notFound();

  const { data: campaign } = await supabase
    .from("campaigns").select("id, name").eq("id", id).is("deleted_at", null).single();
  if (!campaign) notFound();

  const { data: plotThreads } = await supabase
    .from("plot_threads")
    .select("id, title, description, status, priority, resolution_notes, gm_notes, gm_only")
    .eq("campaign_id", id).is("deleted_at", null).order("priority").order("title");

  return <PlotThreadList campaignId={id} campaignName={campaign.name} plotThreads={plotThreads ?? []} role={membership.role} userId={user.id} />;
}
