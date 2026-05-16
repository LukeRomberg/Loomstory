import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { CharacterList } from "./character-list";

export default async function CharactersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { id: userId } = await requireUser();
  const supabase = await createClient();

  const [{ data: membership }, { data: campaign }, { data: characters }] =
    await Promise.all([
      supabase
        .from("campaign_members").select("role")
        .eq("campaign_id", id).eq("user_id", userId).is("deleted_at", null).single(),
      supabase
        .from("campaigns").select("id, name, system_id")
        .eq("id", id).is("deleted_at", null).single(),
      supabase
        .from("characters")
        .select("id, name, level, hp_current, hp_max, system_id, user_id, portrait_url, data")
        .eq("campaign_id", id).is("deleted_at", null).order("name"),
    ]);

  if (!membership) notFound();
  if (!campaign) notFound();

  // Fetch system slug for wizard config lookup
  const { data: system } = campaign.system_id
    ? await supabase.from("systems").select("slug").eq("id", campaign.system_id).single()
    : { data: null };

  return (
    <CharacterList
      campaignId={id}
      campaignName={campaign.name}
      characters={characters ?? []}
      role={membership.role}
      userId={userId}
      systemId={campaign.system_id}
      systemSlug={system?.slug ?? null}
    />
  );
}
