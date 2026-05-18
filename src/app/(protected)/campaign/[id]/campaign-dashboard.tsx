"use client";

import { useState } from "react";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import { ChevronLeft, Settings } from "lucide-react";
import { SettingsModal } from "@/components/loomstory/settings-modal";
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
  systemSlug: _systemSlug,
  userId,
}: CampaignDashboardProps) {
  const router = useTransitionRouter();
  const isGm = role === "gm";

  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      {/* Immersive bookshelf — sits at z-45 to cover the AppHeader (z-40) but stay below modals (z-50) */}
      <div className="fixed inset-0 z-[45] flex items-center justify-center overflow-hidden bg-leather">
        <BookshelfImage
          className="w-[min(100vw,calc(100vh*16/9))]"
          sections={CAMPAIGN_SECTIONS.map((section) => ({
            slug: section.slug,
            href: `/campaign/${campaign.id}/${section.slug}`,
          }))}
        />

        {/* Overlay: back to library */}
        <button
          onClick={() => router.push("/dashboard")}
          aria-label="Back to library"
          className="absolute left-4 top-4 z-[46] flex items-center gap-1.5 rounded-md bg-leather/70 px-3 py-1.5 text-gold shadow-lg shadow-black/60 ring-1 ring-gold/20 backdrop-blur-sm transition hover:bg-leather/85 hover:text-gold"
        >
          <ChevronLeft className="size-4" />
          <span className="font-subheading text-sm font-bold uppercase tracking-[0.18em]">
            Library
          </span>
        </button>

        {/* Overlay: campaign name plate */}
        <div className="pointer-events-none absolute left-1/2 top-4 z-[46] -translate-x-1/2 rounded-md bg-leather/70 px-4 py-1.5 font-heading text-base font-bold uppercase tracking-[0.22em] text-gold shadow-lg shadow-black/60 ring-1 ring-gold/20 backdrop-blur-sm sm:text-lg">
          {campaign.name}
        </div>

        {/* Overlay: settings cog (GM only) */}
        {isGm && (
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Campaign settings"
            className="absolute right-4 top-4 z-[46] rounded-md bg-leather/70 p-2 text-gold shadow-lg shadow-black/60 ring-1 ring-gold/20 backdrop-blur-sm transition hover:bg-leather/85 hover:text-gold"
          >
            <Settings className="size-5" />
          </button>
        )}
      </div>

      {isGm && (
        <SettingsModal campaignId={campaign.id} userId={userId} open={settingsOpen} onOpenChange={setSettingsOpen} />
      )}
    </>
  );
}
