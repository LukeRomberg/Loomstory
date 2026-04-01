import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CharacterList } from "./character-list";

export default async function CharactersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("campaign_members").select("role")
    .eq("campaign_id", id).eq("user_id", user.id).is("deleted_at", null).single();
  if (!membership) notFound();

  const { data: campaign } = await supabase
    .from("campaigns").select("id, name, system_id")
    .eq("id", id).is("deleted_at", null).single();
  if (!campaign) notFound();

  const { data: characters } = await supabase
    .from("characters")
    .select("id, name, level, hp_current, hp_max, system_id, user_id, portrait_url, data")
    .eq("campaign_id", id).is("deleted_at", null).order("name");

  return (
    <CharacterList
      campaignId={id}
      campaignName={campaign.name}
      characters={characters ?? []}
      role={membership.role}
      userId={user.id}
      systemId={campaign.system_id}
    />
  );
}
