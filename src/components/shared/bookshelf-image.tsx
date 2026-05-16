import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CAMPAIGN_SECTIONS } from "@/lib/sections";

interface BookshelfSection {
  slug: string;
  onClick?: () => void;
  href?: string;
}

interface BookshelfImageProps {
  sections: BookshelfSection[];
  className?: string;
}

// Hotspot positions are percentages of the 1672×941 source image (16:9).
// Top shelf: 8 books in a row (NPCs through Characters), with Events as the
// anchor at 33% and the other books cascading out from there with growing
// shift (Δ ≈ 2% × position offset from Events).
// Bottom shelf interactive items: Locations (globe), Sessions (stacked books).
const HOTSPOTS: Record<
  string,
  { left: string; top: string; width: string; height: string }
> = {
  npcs: { left: "16%", top: "13%", width: "6.5%", height: "45%" },
  factions: { left: "24.5%", top: "13%", width: "6.5%", height: "45%" },
  events: { left: "33%", top: "13%", width: "6.5%", height: "45%" },
  conversations: { left: "41.5%", top: "13%", width: "10%", height: "45%" },
  "plot-threads": { left: "53.5%", top: "13%", width: "6.5%", height: "45%" },
  items: { left: "62%", top: "13%", width: "6.5%", height: "45%" },
  lore: { left: "70.5%", top: "13%", width: "10%", height: "45%" },
  characters: { left: "82.5%", top: "13%", width: "6.5%", height: "45%" },
  locations: { left: "8%", top: "61%", width: "12%", height: "26%" },
  sessions: { left: "16%", top: "77%", width: "16%", height: "13%" },
};

export function BookshelfImage({ sections, className }: BookshelfImageProps) {
  const sectionMap = new Map(sections.map((s) => [s.slug, s]));
  const titleBySlug = new Map(
    CAMPAIGN_SECTIONS.map((s) => [s.slug, s.title])
  );

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
      {sections.map((section) => {
        const pos = HOTSPOTS[section.slug];
        const title = titleBySlug.get(section.slug) ?? section.slug;
        if (!pos) return null;

        const hotspotClassName =
          "absolute cursor-pointer rounded-sm transition-all duration-150 hover:bg-gold/20 hover:shadow-[inset_0_0_24px_rgba(200,162,94,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold";

        if (section.href) {
          return (
            <Link
              key={section.slug}
              href={section.href}
              aria-label={title}
              data-testid="bookshelf-hotspot"
              className={hotspotClassName}
              style={pos}
            >
              <span className="sr-only">{title}</span>
            </Link>
          );
        }

        return (
          <button
            key={section.slug}
            type="button"
            onClick={section.onClick}
            aria-label={title}
            data-testid="bookshelf-hotspot"
            className={hotspotClassName}
            style={pos}
          >
            <span className="sr-only">{title}</span>
          </button>
        );
      })}
    </div>
  );
}
