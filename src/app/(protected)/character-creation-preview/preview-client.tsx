"use client";

import { useTransitionRouter } from "@/hooks/use-transition-router";
import { CharacterCreationWizard } from "@/components/loomstory/wizard/character-creation-wizard";
import { getWizardConfig } from "@/lib/character/wizard-registry";

interface Props {
  systemId: string;
  systemSlug: string;
  userId: string;
}

export function CharacterCreationPreviewClient({
  systemId,
  systemSlug,
  userId,
}: Props) {
  const router = useTransitionRouter();
  const wizardConfig = getWizardConfig(systemSlug);

  if (!wizardConfig) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">
          No wizard config found for system slug “{systemSlug}”.
        </p>
      </div>
    );
  }

  return (
    <CharacterCreationWizard
      open
      onClose={() => router.push("/dashboard")}
      campaignId="preview"
      systemId={systemId}
      systemSlug={systemSlug}
      userId={userId}
      wizardConfig={wizardConfig}
    />
  );
}
