/**
 * Wikilink parsing and resolution.
 *
 * Supports two syntax forms:
 *   [[Entity Name]]           — name = display text
 *   [[Entity Name|display]]   — name for lookup, display for rendering
 *
 * DB stores raw markup. API resolves on read. UI renders as links.
 */

export interface ParsedWikilink {
  name: string;
  displayText: string;
  start: number;
  end: number;
}

export interface ResolvedEntity {
  name: string;
  entityType: string;
  entityId: string;
  resolved: boolean;
}

const WIKILINK_REGEX = /\[\[([^\]]+)\]\]/g;

/**
 * Parses all [[wikilinks]] from a text string.
 * Returns array of parsed links with name, display text, and positions.
 */
export function parseWikilinks(text: string): ParsedWikilink[] {
  if (!text) return [];

  const results: ParsedWikilink[] = [];
  let match;

  // Reset regex state
  WIKILINK_REGEX.lastIndex = 0;

  while ((match = WIKILINK_REGEX.exec(text)) !== null) {
    const inner = match[1];
    const pipeIndex = inner.indexOf("|");

    const name = pipeIndex >= 0 ? inner.slice(0, pipeIndex).trim() : inner.trim();
    const displayText = pipeIndex >= 0 ? inner.slice(pipeIndex + 1).trim() : inner.trim();

    results.push({
      name,
      displayText,
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return results;
}

/**
 * Renders wikilinks to a plain text representation with resolution markers.
 * Used for non-React contexts (API responses, plain text output).
 */
export function renderWikilinksToText(
  text: string,
  resolved: ResolvedEntity[]
): string {
  if (!text) return "";

  const resolvedMap = new Map(resolved.map((r) => [r.name.toLowerCase(), r]));
  const links = parseWikilinks(text);

  if (links.length === 0) return text;

  let result = "";
  let lastEnd = 0;

  for (const link of links) {
    result += text.slice(lastEnd, link.start);

    const entity = resolvedMap.get(link.name.toLowerCase());
    if (entity?.resolved) {
      result += link.displayText;
    } else {
      result += `${link.displayText} [unresolved]`;
    }

    lastEnd = link.end;
  }

  result += text.slice(lastEnd);
  return result;
}
