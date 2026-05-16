"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Settings } from "lucide-react";
import { SettingsModal } from "@/components/loomstory/settings-modal";
import { NpcModal } from "@/components/loomstory/npc-modal";
import { FactionModal } from "@/components/loomstory/faction-modal";
import { ItemModal } from "@/components/loomstory/item-modal";
import { PlotThreadModal } from "@/components/loomstory/plot-thread-modal";
import { LoreModal } from "@/components/loomstory/lore-modal";
import { EventModal } from "@/components/loomstory/event-modal";
import { CharacterModal } from "@/components/loomstory/character-modal";
import { BookshelfImage } from "@/components/shared/bookshelf-image";
import { CAMPAIGN_SECTIONS } from "@/lib/sections";

interface CampaignDashboardProps {
  campaign: {
    id: string;
    name: string;
    description: string | null;
    system_id: string | null;
  };
  role: string;
  systemSlug: string | null;
  userId: string;
}

export function CampaignDashboard({
  campaign,
  role,
  systemSlug,
  userId,
}: CampaignDashboardProps) {
  const router = useRouter();
  const isGm = role === "gm";

  const [npcModalOpen, setNpcModalOpen] = useState(false);
  const [factionModalOpen, setFactionModalOpen] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [plotThreadModalOpen, setPlotThreadModalOpen] = useState(false);
  const [loreModalOpen, setLoreModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [characterModalOpen, setCharacterModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const modalSetters: Record<string, () => void> = {
    npcs: () => setNpcModalOpen(true),
    factions: () => setFactionModalOpen(true),
    events: () => setEventModalOpen(true),
    "plot-threads": () => setPlotThreadModalOpen(true),
    items: () => setItemModalOpen(true),
    lore: () => setLoreModalOpen(true),
    characters: () => setCharacterModalOpen(true),
  };

  return (
    <>
      {/* Immersive bookshelf — sits at z-45 to cover the AppHeader (z-40) but stay below modals (z-50) */}
      <div className="fixed inset-0 z-[45] flex items-center justify-center overflow-hidden bg-leather">
        <BookshelfImage
          className="max-h-screen w-full"
          sections={CAMPAIGN_SECTIONS.map((section) => {
            if (
              section.slug === "sessions" ||
              section.slug === "conversations" ||
              section.slug === "locations"
            ) {
              return {
                slug: section.slug,
                href: `/campaign/${campaign.id}/${section.slug}`,
              };
            }
            return {
              slug: section.slug,
              onClick: modalSetters[section.slug],
            };
          })}
        />

        {/* Overlay: back to library */}
        <button
          onClick={() => router.push("/dashboard")}
          aria-label="Back to library"
          className="absolute left-4 top-4 z-[46] flex items-center gap-1.5 rounded-md px-3 py-2 font-subheading text-xs uppercase tracking-[0.18em] text-gold/80 transition hover:bg-leather/60 hover:text-gold"
        >
          <ChevronLeft className="size-4" />
          Library
        </button>

        {/* Overlay: campaign name plate */}
        <div className="pointer-events-none absolute left-1/2 top-5 z-[46] -translate-x-1/2 font-heading text-sm uppercase tracking-[0.22em] text-gold/85 sm:text-base">
          {campaign.name}
        </div>

        {/* Overlay: settings cog (GM only) */}
        {isGm && (
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Campaign settings"
            className="absolute right-4 top-4 z-[46] rounded-md p-2 text-gold/80 transition hover:bg-leather/60 hover:text-gold"
          >
            <Settings className="size-5" />
          </button>
        )}
      </div>

      {/* Modals — render at z-50, sit above the bookshelf */}
      <NpcModal campaignId={campaign.id} userId={userId} role={role} open={npcModalOpen} onOpenChange={setNpcModalOpen} />
      <FactionModal campaignId={campaign.id} userId={userId} role={role} open={factionModalOpen} onOpenChange={setFactionModalOpen} />
      <ItemModal campaignId={campaign.id} userId={userId} role={role} open={itemModalOpen} onOpenChange={setItemModalOpen} />
      <PlotThreadModal campaignId={campaign.id} userId={userId} role={role} open={plotThreadModalOpen} onOpenChange={setPlotThreadModalOpen} />
      <LoreModal campaignId={campaign.id} userId={userId} role={role} open={loreModalOpen} onOpenChange={setLoreModalOpen} />
      <EventModal campaignId={campaign.id} userId={userId} role={role} open={eventModalOpen} onOpenChange={setEventModalOpen} />
      <CharacterModal campaignId={campaign.id} userId={userId} role={role} systemId={campaign.system_id} systemSlug={systemSlug} open={characterModalOpen} onOpenChange={setCharacterModalOpen} />
      {isGm && (
        <SettingsModal campaignId={campaign.id} userId={userId} open={settingsOpen} onOpenChange={setSettingsOpen} />
      )}
    </>
  );
}
