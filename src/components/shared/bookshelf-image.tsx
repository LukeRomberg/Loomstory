import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CAMPAIGN_SECTIONS } from "@/lib/sections";
import { LinkPendingOverlay } from "@/components/shared/link-pending-overlay";

interface BookshelfSection {
  slug: string;
  onClick?: () => void;
  href?: string;
}

interface BookshelfImageProps {
  sections: BookshelfSection[];
  className?: string;
}

type Position = { left: string; top: string; width: string; height: string };

// Hotspot positions are percentages of the 1672×941 source image (16:9).
// Sessions covers only the bottom book of the stacked pair (the one with the
// "Sessions" label); the upper book is left non-interactive for now.
const HOTSPOTS: Record<string, Position | Position[]> = {
  npcs: { left: "19%", top: "13%", width: "6%", height: "45%" },
  factions: { left: "25.5%", top: "13%", width: "6.5%", height: "45%" },
  events: { left: "33%", top: "13%", width: "6.5%", height: "45%" },
  conversations: { left: "41.5%", top: "13%", width: "10%", height: "45%" },
  "plot-threads": { left: "53.5%", top: "13%", width: "6.5%", height: "45%" },
  items: { left: "61%", top: "13%", width: "6.5%", height: "45%" },
  lore: { left: "68.5%", top: "10%", width: "11%", height: "49%" },
  characters: { left: "81%", top: "10%", width: "6.5%", height: "49%" },
  locations: { left: "7%", top: "65%", width: "12%", height: "21%" },
  sessions: { left: "16.5%", top: "87%", width: "18%", height: "7%" },
};

export function BookshelfImage({ sections, className }: BookshelfImageProps) {
  const titleBySlug = new Map(CAMPAIGN_SECTIONS.map((s) => [s.slug, s.title]));

  return (
    <div
      className={cn("relative", className)}
      style={{ aspectRatio: "16 / 9" }}
    >
      <Image
        src="/textures/bookshelf.png"
        alt=""
        fill
        priority
        sizes="(max-width: 768px) 100vw, 1152px"
        className="object-contain"
      />
      {sections.flatMap((section) => {
        const pos = HOTSPOTS[section.slug];
        if (!pos) return [];

        const title = titleBySlug.get(section.slug) ?? section.slug;
        const regions = Array.isArray(pos) ? pos : [pos];

        return regions.map((region, i) => {
          const isPrimary = i === 0;
          const hotspotClassName = cn(
            "absolute cursor-pointer transition-all duration-150 hover:bg-gold/20 hover:shadow-[inset_0_0_24px_rgba(200,162,94,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
            section.slug === "locations" ? "rounded-full" : "rounded-sm"
          );

          const a11yProps = isPrimary
            ? {
                "aria-label": title,
                "data-testid": "bookshelf-hotspot",
              }
            : {
                "aria-hidden": true,
                tabIndex: -1,
                "data-testid": "bookshelf-hotspot-segment",
              };

          const key = `${section.slug}-${i}`;

          if (section.href) {
            return (
              <Link
                key={key}
                href={section.href}
                className={hotspotClassName}
                style={region}
                {...a11yProps}
              >
                {isPrimary && <span className="sr-only">{title}</span>}
                {isPrimary && <LinkPendingOverlay />}
              </Link>
            );
          }

          return (
            <button
              key={key}
              type="button"
              onClick={section.onClick}
              className={hotspotClassName}
              style={region}
              {...a11yProps}
            >
              {isPrimary && <span className="sr-only">{title}</span>}
            </button>
          );
        });
      })}
    </div>
  );
}
