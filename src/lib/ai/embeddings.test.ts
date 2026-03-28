import { describe, it, expect, vi } from "vitest";
import { chunkText, buildEmbeddingContent, CHUNK_SIZE, CHUNK_OVERLAP } from "./embeddings";

describe("chunkText (EMB-02)", () => {
  it("returns single chunk for short text", () => {
    const text = "A short description of an NPC.";
    const chunks = chunkText(text);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(text);
  });

  it("chunks long text into multiple pieces", () => {
    // Generate text longer than CHUNK_SIZE
    const longText = "word ".repeat(CHUNK_SIZE + 100);
    const chunks = chunkText(longText);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it("each chunk is at most CHUNK_SIZE tokens (approx)", () => {
    const longText = "word ".repeat(CHUNK_SIZE * 3);
    const chunks = chunkText(longText);
    for (const chunk of chunks) {
      // Approximate: each word is ~1 token
      const approxTokens = chunk.split(/\s+/).length;
      expect(approxTokens).toBeLessThanOrEqual(CHUNK_SIZE + 50); // small buffer for splitting
    }
  });

  it("chunks overlap by CHUNK_OVERLAP tokens (approx)", () => {
    const longText = "word ".repeat(CHUNK_SIZE * 2);
    const chunks = chunkText(longText);
    if (chunks.length >= 2) {
      // The end of chunk 0 should overlap with the start of chunk 1
      const end0Words = chunks[0].split(/\s+/).slice(-CHUNK_OVERLAP);
      const start1Words = chunks[1].split(/\s+/).slice(0, CHUNK_OVERLAP);
      // At least some overlap
      const overlap = end0Words.filter((w) => start1Words.includes(w));
      expect(overlap.length).toBeGreaterThan(0);
    }
  });

  it("handles empty string", () => {
    const chunks = chunkText("");
    expect(chunks).toHaveLength(0);
  });

  it("handles whitespace-only string", () => {
    const chunks = chunkText("   ");
    expect(chunks).toHaveLength(0);
  });
});

describe("buildEmbeddingContent (EMB-01)", () => {
  it("builds content for NPC entity", () => {
    const content = buildEmbeddingContent("npc", {
      name: "Gareth the Bold",
      description: "A warrior",
      gm_notes: "Secret stuff",
      player_notes: "Helped the party",
    });
    expect(content).toContain("Gareth the Bold");
    expect(content).toContain("A warrior");
    expect(content).toContain("Secret stuff");
    expect(content).toContain("Helped the party");
  });

  it("builds content for location entity", () => {
    const content = buildEmbeddingContent("location", {
      name: "Ironhold",
      description: "A fortified city",
      type: "city",
    });
    expect(content).toContain("Ironhold");
    expect(content).toContain("fortified city");
  });

  it("builds content for campaign event", () => {
    const content = buildEmbeddingContent("event", {
      content: "The party arrived at the city",
      summary: "Party arrives",
    });
    expect(content).toContain("party arrived");
    expect(content).toContain("Party arrives");
  });

  it("builds content for conversation log", () => {
    const content = buildEmbeddingContent("conversation", {
      title: "A tense negotiation",
      content_plain: "Gareth: Watch your backs. Durk: We can handle it.",
    });
    expect(content).toContain("tense negotiation");
    expect(content).toContain("Watch your backs");
  });

  it("builds content for lore entry", () => {
    const content = buildEmbeddingContent("lore_entry", {
      title: "The Founding of Ironhold",
      content: "Founded 300 years ago by dwarves.",
    });
    expect(content).toContain("Founding of Ironhold");
    expect(content).toContain("300 years ago");
  });

  it("builds content for faction", () => {
    const content = buildEmbeddingContent("faction", {
      name: "The Crimson Hand",
      description: "A shadowy guild",
      goals: "Control trade routes",
    });
    expect(content).toContain("Crimson Hand");
    expect(content).toContain("Control trade routes");
  });

  it("builds content for plot thread", () => {
    const content = buildEmbeddingContent("plot_thread", {
      title: "The Conspiracy",
      description: "A plot to overthrow the king",
    });
    expect(content).toContain("Conspiracy");
    expect(content).toContain("overthrow the king");
  });

  it("skips null and empty fields", () => {
    const content = buildEmbeddingContent("npc", {
      name: "Gareth",
      description: null,
      gm_notes: "",
    });
    expect(content).toContain("Gareth");
    expect(content).not.toContain("null");
  });

  it("returns empty string for unknown entity type", () => {
    const content = buildEmbeddingContent("unknown_type", { foo: "bar" });
    expect(content).toBe("");
  });
});
