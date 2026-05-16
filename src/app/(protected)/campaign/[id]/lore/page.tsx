import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { LoreList } from "./lore-list";

export default async function LorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { id: userId } = await requireUser();
  const supabase = await createClient();

  const [{ data: membership }, { data: campaign }, { data: loreEntries }] =
    await Promise.all([
      supabase
        .from("campaign_members").select("role")
        .eq("campaign_id", id).eq("user_id", userId).is("deleted_at", null).single(),
      supabase
        .from("campaigns").select("id, name").eq("id", id).is("deleted_at", null).single(),
      supabase
        .from("lore_entries")
        .select("id, title, content, tags, gm_only")
        .eq("campaign_id", id).is("deleted_at", null).order("title"),
    ]);

  if (!membership) notFound();
  if (!campaign) notFound();

  return <LoreList campaignId={id} campaignName={campaign.name} loreEntries={loreEntries ?? []} role={membership.role} userId={userId} />;
}
