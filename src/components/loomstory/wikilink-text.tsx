"use client";

import { useTransitionRouter } from "@/hooks/use-transition-router";
import { parseWikilinks, type ResolvedEntity } from "@/lib/wikilinks";

const ENTITY_ROUTES: Record<string, string> = {
  npc: "npcs",
  location: "locations",
  faction: "factions",
  item: "items",
  plot_thread: "plot-threads",
  lore_entry: "lore",
  event: "events",
};

interface WikilinkTextProps {
  text: string;
  campaignId: string;
  resolvedEntities: ResolvedEntity[];
}

/**
 * Renders text with [[wikilinks]] as clickable entity links.
 * Resolved links are gold and navigate to entity detail pages.
 * Unresolved links are muted with a distinct style.
 */
export function WikilinkText({
  text,
  campaignId,
  resolvedEntities,
}: WikilinkTextProps) {
  const router = useTransitionRouter();

  if (!text) return null;

  const links = parseWikilinks(text);
  if (links.length === 0) return <span>{text}</span>;

  const resolvedMap = new Map(
    resolvedEntities.map((r) => [r.name.toLowerCase(), r])
  );

  const parts: React.ReactNode[] = [];
  let lastEnd = 0;

  links.forEach((link, i) => {
    // Text before this link
    if (link.start > lastEnd) {
      parts.push(
        <span key={`text-${i}`}>{text.slice(lastEnd, link.start)}</span>
      );
    }

    const entity = resolvedMap.get(link.name.toLowerCase());

    if (entity?.resolved) {
      const route = ENTITY_ROUTES[entity.entityType] ?? entity.entityType;
      const usesSelectedParam =
        entity.entityType === "npc" || entity.entityType === "event";
      const href = usesSelectedParam
        ? `/campaign/${campaignId}/${route}?selected=${entity.entityId}`
        : `/campaign/${campaignId}/${route}/${entity.entityId}`;
      parts.push(
        <span
          key={`link-${i}`}
          className="text-gold cursor-pointer hover:underline font-medium"
          title={`${entity.entityType}: ${entity.name}`}
          data-entity-type={entity.entityType}
          data-entity-id={entity.entityId}
          onClick={() => router.push(href)}
          role="link"
        >
          {link.displayText}
        </span>
      );
    } else {
      parts.push(
        <span
          key={`link-${i}`}
          className="text-muted-foreground italic border-b border-dashed border-muted-foreground/50"
          title={`Unresolved: ${link.name}`}
        >
          {link.displayText}
        </span>
      );
    }

    lastEnd = link.end;
  });

  // Remaining text after last link
  if (lastEnd < text.length) {
    parts.push(<span key="text-end">{text.slice(lastEnd)}</span>);
  }

  return <span>{parts}</span>;
}
