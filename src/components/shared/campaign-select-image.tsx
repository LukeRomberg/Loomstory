"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Crown, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { LinkPendingOverlay } from "@/components/shared/link-pending-overlay";

interface CampaignSummary {
  id: string;
  name: string;
  role: string;
}

interface CampaignSelectImageProps {
  campaigns: CampaignSummary[];
  page: number;
  onPageChange: (page: number) => void;
  onCreateCampaign: () => void;
  className?: string;
}

type Position = { left: string; top: string; width: string; height: string };

const PAGE_SIZE = 9;

// Hotspots are tuned against /textures/campaign-select.png (16:9).
// Three cabinets × three shelves of face-out books, left→right, top→bottom.
const HOTSPOTS: Position[] = [
  { left: "19.5%", top: "17%", width: "9%", height: "20%" },
  { left: "19.5%", top: "41%", width: "9%", height: "20%" },
  { left: "19.5%", top: "65.5%", width: "9%", height: "20%" },
  { left: "45%", top: "17%", width: "9%", height: "20%" },
  { left: "45%", top: "41%", width: "9%", height: "20%" },
  { left: "45%", top: "65.5%", width: "9%", height: "20%" },
  { left: "71.5%", top: "17%", width: "9%", height: "20%" },
  { left: "71.5%", top: "41%", width: "9%", height: "20%" },
  { left: "71.5%", top: "65.5%", width: "9%", height: "20%" },
];

export function CampaignSelectImage({
  campaigns,
  page,
  onPageChange,
  onCreateCampaign,
  className,
}: CampaignSelectImageProps) {
  const totalPages = Math.max(1, Math.ceil(campaigns.length / PAGE_SIZE));
  const start = page * PAGE_SIZE;
  const pageCampaigns = campaigns.slice(start, start + PAGE_SIZE);
  const showArrows = campaigns.length > PAGE_SIZE;

  return (
    <div
      className={cn("relative", className)}
      style={{ aspectRatio: "16 / 9" }}
    >
      <Image
        src="/textures/campaign-select.png"
        alt=""
        fill
        priority
        sizes="(max-width: 768px) 100vw, 1152px"
        className="object-contain"
      />

      {pageCampaigns.map((campaign, i) => {
        const pos = HOTSPOTS[i];
        const isGm = campaign.role === "gm";
        return (
          <Link
            key={campaign.id}
            href={`/campaign/${campaign.id}`}
            data-testid="campaign-hotspot"
            aria-label={campaign.name}
            className="group/book absolute flex flex-col items-center justify-end rounded-sm ring-1 ring-transparent transition-all duration-150 hover:ring-2 hover:ring-gold/70 hover:shadow-[inset_0_0_28px_rgba(200,162,94,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            style={pos}
          >
            <LinkPendingOverlay />
            <span
              data-testid={`role-badge-${isGm ? "gm" : "player"}`}
              aria-hidden="true"
              className="absolute right-0.5 top-0.5 rounded-full bg-leather/85 p-1 text-gold shadow-md shadow-black/60 ring-1 ring-gold/30"
            >
              {isGm ? (
                <Crown className="size-3" />
              ) : (
                <User className="size-3" />
              )}
            </span>
            <span className="mb-1 max-w-[95%] truncate rounded-sm bg-leather/80 px-1.5 py-0.5 text-center font-heading text-[10px] uppercase tracking-[0.12em] text-gold shadow-md shadow-black/60 ring-1 ring-gold/30">
              {campaign.name}
            </span>
          </Link>
        );
      })}

      {showArrows && (
        <>
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 0}
            aria-label="Previous shelf"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-md bg-leather/75 p-2 text-gold shadow-lg shadow-black/60 ring-1 ring-gold/30 backdrop-blur-sm transition hover:bg-leather/90 hover:text-gold disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
            aria-label="Next shelf"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-leather/75 p-2 text-gold shadow-lg shadow-black/60 ring-1 ring-gold/30 backdrop-blur-sm transition hover:bg-leather/90 hover:text-gold disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      )}

      <button
        type="button"
        onClick={onCreateCampaign}
        aria-label="New Campaign"
        className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-md bg-leather/80 px-3 py-1.5 text-gold shadow-lg shadow-black/60 ring-1 ring-gold/40 backdrop-blur-sm transition hover:bg-leather/95 hover:text-gold hover:ring-gold/70"
      >
        <Plus className="size-4" />
        <span className="font-heading text-xs font-bold uppercase tracking-[0.18em]">
          New Campaign
        </span>
      </button>
    </div>
  );
}
