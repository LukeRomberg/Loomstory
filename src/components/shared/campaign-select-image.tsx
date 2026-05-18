"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Anchor,
  BookOpen,
  Castle,
  ChevronLeft,
  ChevronRight,
  Compass,
  Crown,
  Dices,
  Eye,
  Feather,
  Flame,
  Gem,
  Hammer,
  Moon,
  Mountain,
  Plus,
  ScrollText,
  Shield,
  Skull,
  Snowflake,
  Sparkles,
  Star,
  Sword,
  User,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LinkPendingOverlay } from "@/components/shared/link-pending-overlay";

interface CampaignSummary {
  id: string;
  name: string;
  role: string;
  systemName?: string;
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
// Row-major: top row (1-3), middle row (4-6), bottom row (7-9),
// each row spanning the three cabinets left → right.
const HOTSPOTS: Position[] = [
  { left: "19.5%", top: "17%", width: "9%", height: "20%" },
  { left: "45%", top: "17%", width: "9%", height: "20%" },
  { left: "71.5%", top: "17%", width: "9%", height: "20%" },
  { left: "19.5%", top: "41%", width: "9%", height: "20%" },
  { left: "45%", top: "41%", width: "9%", height: "20%" },
  { left: "71.5%", top: "41%", width: "9%", height: "20%" },
  { left: "19.5%", top: "65.5%", width: "9%", height: "20%" },
  { left: "45%", top: "65.5%", width: "9%", height: "20%" },
  { left: "71.5%", top: "65.5%", width: "9%", height: "20%" },
];

const EMBLEMS: ReadonlyArray<readonly [string, LucideIcon]> = [
  ["sword", Sword],
  ["skull", Skull],
  ["crown", Crown],
  ["scroll", ScrollText],
  ["dice", Dices],
  ["sparkles", Sparkles],
  ["book", BookOpen],
  ["flame", Flame],
  ["moon", Moon],
  ["star", Star],
  ["shield", Shield],
  ["compass", Compass],
  ["castle", Castle],
  ["anchor", Anchor],
  ["feather", Feather],
  ["gem", Gem],
  ["hammer", Hammer],
  ["snowflake", Snowflake],
  ["eye", Eye],
  ["mountain", Mountain],
];

function pickEmblem(id: string): readonly [string, LucideIcon] {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return EMBLEMS[Math.abs(hash) % EMBLEMS.length];
}

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
        const [emblemKey, Emblem] = pickEmblem(campaign.id);
        return (
          <Link
            key={campaign.id}
            href={`/campaign/${campaign.id}`}
            data-testid="campaign-hotspot"
            aria-label={campaign.name}
            className="group/book absolute flex flex-col items-center justify-center gap-1 rounded-sm p-1 ring-1 ring-transparent transition-all duration-150 hover:ring-2 hover:ring-gold/70 hover:shadow-[inset_0_0_28px_rgba(200,162,94,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
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

            <Emblem
              data-testid="book-emblem"
              data-emblem={emblemKey}
              aria-hidden="true"
              className="size-5 text-gold/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] sm:size-7"
            />

            <span className="embossed-gold line-clamp-2 max-w-[95%] text-center font-heading text-[9px] font-bold uppercase leading-tight tracking-[0.1em] sm:text-[11px]">
              {campaign.name}
            </span>

            {campaign.systemName && (
              <span
                data-testid="book-system"
                className="max-w-[95%] truncate text-center font-mono text-[7px] uppercase tracking-wider text-gold/60 sm:text-[9px]"
              >
                {campaign.systemName}
              </span>
            )}
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
        className="absolute right-3 top-3 flex items-center gap-1.5 rounded-md bg-leather/80 px-3 py-1.5 text-gold shadow-lg shadow-black/60 ring-1 ring-gold/40 backdrop-blur-sm transition hover:bg-leather/95 hover:text-gold hover:ring-gold/70"
      >
        <Plus className="size-4" />
        <span className="font-heading text-xs font-bold uppercase tracking-[0.18em]">
          New Campaign
        </span>
      </button>
    </div>
  );
}
