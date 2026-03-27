import { describe, it, expect } from "vitest";
import {
  buildEntityExtractionPrompt,
  buildEventExtractionPrompt,
  buildConversationExtractionPrompt,
  type EntityManifest,
} from "./extraction-prompts";

const emptyManifest: EntityManifest = {
  npcs: [],
  locations: [],
  factions: [],
  items: [],
};

const populatedManifest: EntityManifest = {
  npcs: [
    { id: "npc-1", name: "Gareth the Bold", aliases: ["Gareth", "The Bold One"] },
    { id: "npc-2", name: "Marta", aliases: [] },
  ],
  locations: [
    { id: "loc-1", name: "Ironhold", aliases: ["The Iron City"] },
  ],
  factions: [
    { id: "fac-1", name: "The Crimson Hand" },
  ],
  items: [
    { id: "item-1", name: "Flame Tongue" },
  ],
};

describe("buildEntityExtractionPrompt", () => {
  it("returns system and buildUser function", () => {
    const prompt = buildEntityExtractionPrompt(emptyManifest);
    expect(prompt.system).toContain("TTRPG session processing assistant");
    expect(typeof prompt.buildUser).toBe("function");
  });

  it("includes entity manifest in user message", () => {
    const prompt = buildEntityExtractionPrompt(populatedManifest);
    const userMsg = prompt.buildUser("The party met Gareth at the tavern.");
    expect(userMsg).toContain("Gareth the Bold");
    expect(userMsg).toContain("npc-1");
    expect(userMsg).toContain("The Bold One");
    expect(userMsg).toContain("Ironhold");
    expect(userMsg).toContain("The Crimson Hand");
    expect(userMsg).toContain("Flame Tongue");
  });

  it("shows empty manifest message when no entities exist", () => {
    const prompt = buildEntityExtractionPrompt(emptyManifest);
    const userMsg = prompt.buildUser("Notes here");
    expect(userMsg).toContain("No entities in the knowledge base yet");
  });

  it("includes session notes in user message", () => {
    const prompt = buildEntityExtractionPrompt(emptyManifest);
    const userMsg = prompt.buildUser("The party fought a dragon.");
    expect(userMsg).toContain("The party fought a dragon.");
  });

  it("system prompt instructs JSON-only response", () => {
    const prompt = buildEntityExtractionPrompt(emptyManifest);
    expect(prompt.system).toContain("JSON only");
  });

  it("system prompt defines expected output structure", () => {
    const prompt = buildEntityExtractionPrompt(emptyManifest);
    expect(prompt.system).toContain("new_npcs");
    expect(prompt.system).toContain("new_locations");
    expect(prompt.system).toContain("new_factions");
    expect(prompt.system).toContain("new_items");
    expect(prompt.system).toContain("updated_entities");
  });
});

describe("buildEventExtractionPrompt", () => {
  it("returns system and buildUser function", () => {
    const prompt = buildEventExtractionPrompt(emptyManifest);
    expect(prompt.system).toContain("narrative events");
    expect(typeof prompt.buildUser).toBe("function");
  });

  it("defines weight scale in system prompt", () => {
    const prompt = buildEventExtractionPrompt(emptyManifest);
    expect(prompt.system).toContain("WEIGHT SCALE");
    expect(prompt.system).toContain("1 = ambient detail");
    expect(prompt.system).toContain("7 = campaign milestone");
  });

  it("defines all event types", () => {
    const prompt = buildEventExtractionPrompt(emptyManifest);
    const types = [
      "general", "scene", "decision", "discovery", "conversation",
      "promise", "todo", "upcoming", "milestone", "mood", "quote",
    ];
    for (const type of types) {
      expect(prompt.system).toContain(type);
    }
  });

  it("includes entity manifest in user message", () => {
    const prompt = buildEventExtractionPrompt(populatedManifest);
    const userMsg = prompt.buildUser("Notes");
    expect(userMsg).toContain("Gareth the Bold");
  });
});

describe("buildConversationExtractionPrompt", () => {
  it("returns system and buildUser function", () => {
    const prompt = buildConversationExtractionPrompt(emptyManifest);
    expect(prompt.system).toContain("dialogues");
    expect(typeof prompt.buildUser).toBe("function");
  });

  it("defines tone options", () => {
    const prompt = buildConversationExtractionPrompt(emptyManifest);
    const tones = ["friendly", "hostile", "nervous", "defensive"];
    for (const tone of tones) {
      expect(prompt.system).toContain(tone);
    }
  });

  it("instructs narrow scope", () => {
    const prompt = buildConversationExtractionPrompt(emptyManifest);
    expect(prompt.system).toContain("Narrow scope");
    expect(prompt.system).toContain("Only dialogues, not narration");
  });
});
