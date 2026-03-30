import { describe, it, expect } from "vitest";
import { parseWikilinks, renderWikilinksToText, ResolvedEntity } from "./wikilinks";

describe("parseWikilinks (WIKI-01)", () => {
  it("parses simple [[Entity Name]] syntax", () => {
    const result = parseWikilinks("The party met [[Gareth the Bold]] at the gates.");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Gareth the Bold");
    expect(result[0].displayText).toBe("Gareth the Bold");
  });

  it("parses [[Entity Name|display text]] syntax", () => {
    const result = parseWikilinks("They went to [[Ironhold|the iron city]].");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Ironhold");
    expect(result[0].displayText).toBe("the iron city");
  });

  it("parses multiple wikilinks in one string", () => {
    const result = parseWikilinks("[[Gareth]] met [[Marta]] at [[The Silver Hart]].");
    expect(result).toHaveLength(3);
    expect(result[0].name).toBe("Gareth");
    expect(result[1].name).toBe("Marta");
    expect(result[2].name).toBe("The Silver Hart");
  });

  it("returns empty array for text with no wikilinks", () => {
    const result = parseWikilinks("Just a regular sentence.");
    expect(result).toHaveLength(0);
  });

  it("handles empty string", () => {
    const result = parseWikilinks("");
    expect(result).toHaveLength(0);
  });

  it("captures start and end positions", () => {
    const text = "Met [[Gareth]] today.";
    const result = parseWikilinks(text);
    expect(result[0].start).toBe(4);
    expect(result[0].end).toBe(14);
  });

  it("handles wikilinks with special characters in names", () => {
    const result = parseWikilinks("The [[Veil's Shadow]] strikes.");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Veil's Shadow");
  });
});

describe("renderWikilinksToText", () => {
  it("replaces resolved wikilinks with display text", () => {
    const text = "Met [[Gareth the Bold]] today.";
    const resolved = [
      { name: "Gareth the Bold", entityType: "npc", entityId: "npc-1", resolved: true },
    ];
    const result = renderWikilinksToText(text, resolved);
    expect(result).toContain("Gareth the Bold");
  });

  it("preserves display text alias", () => {
    const text = "At [[Ironhold|the iron city]].";
    const resolved = [
      { name: "Ironhold", entityType: "location", entityId: "loc-1", resolved: true },
    ];
    const result = renderWikilinksToText(text, resolved);
    expect(result).toContain("the iron city");
  });

  it("marks unresolved wikilinks", () => {
    const text = "Heard about [[Unknown NPC]].";
    const resolved: ResolvedEntity[] = [];
    const result = renderWikilinksToText(text, resolved);
    expect(result).toContain("Unknown NPC");
    expect(result).toContain("unresolved");
  });
});
