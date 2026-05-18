import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { CharacterCreationPreviewClient } from "./preview-client";

// Side-by-side preview of the new master-detail character creation wizard.
// Lets the user click through the new flow without flipping the production
// "New Character" button on the Characters page. Pulls real Daggerheart
// class data from the DB so detail pane content matches what the wizard
// will show in real use.
//
// Once the new wizard is feature-complete we'll swap CharacterList's import
// from <CharacterWizard> to <CharacterCreationWizard> and delete this route.
export default async function CharacterCreationPreviewPage() {
  const { id: userId } = await requireUser();
  const supabase = await createClient();

  const { data: system } = await supabase
    .from("systems")
    .select("id, slug")
    .eq("slug", "daggerheart")
    .single();

  if (!system) notFound();

  return (
    <CharacterCreationPreviewClient
      systemId={system.id}
      systemSlug={system.slug}
      userId={userId}
    />
  );
}
