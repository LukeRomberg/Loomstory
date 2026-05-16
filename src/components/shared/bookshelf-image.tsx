import Image from "next/image";
import Link from "next/link";
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

// Hotspot positions are percentages of the 1448×1086 source image.
// The 9 books occupy roughly the top half of the bookshelf.
// Tune these via dev server inspection if the click targets feel off.
const HOTSPOTS: Record<
  string,
  { left: string; top: string; width: string; height: string }
> = {
  npcs: { left: "19.5%", top: "16%", width: "5.5%", height: "40%" },
  locations: { left: "25.5%", top: "16%", width: "5.5%", height: "40%" },
  factions: { left: "31.5%", top: "16%", width: "5.5%", height: "40%" },
  events: { left: "37.5%", top: "16%", width: "5.5%", height: "40%" },
  conversations: { left: "43.5%", top: "16%", width: "8%", height: "40%" },
  "plot-threads": { left: "52%", top: "16%", width: "5.5%", height: "40%" },
  items: { left: "58%", top: "16%", width: "5.5%", height: "40%" },
  lore: { left: "64%", top: "16%", width: "8%", height: "40%" },
  characters: { left: "72.5%", top: "16%", width: "5.5%", height: "40%" },
};

export function BookshelfImage({ sections, className }: BookshelfImageProps) {
  const sectionMap = new Map(sections.map((s) => [s.slug, s]));
  const titleBySlug = new Map(
    CAMPAIGN_SECTIONS.map((s) => [s.slug, s.title])
  );

  return (
    <div
      className={`relative mx-auto w-full ${className ?? ""}`}
      style={{ aspectRatio: "1448 / 1086" }}
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
