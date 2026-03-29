import { describe, it, expect, vi } from "vitest";
import { buildRagPrompt } from "./rag-query";

describe("buildRagPrompt", () => {
  it("includes the user's question", () => {
    const prompt = buildRagPrompt("What do we know about Gareth?", []);
    expect(prompt.userMessage).toContain("What do we know about Gareth?");
  });

  it("includes retrieved context chunks", () => {
    const chunks = [
      { chunk_text: "Gareth is a tall warrior.", entity_type: "npc", entity_id: "npc-1" },
      { chunk_text: "He guards the city gates.", entity_type: "npc", entity_id: "npc-1" },
    ];
    const prompt = buildRagPrompt("Tell me about Gareth", chunks);
    expect(prompt.userMessage).toContain("Gareth is a tall warrior.");
    expect(prompt.userMessage).toContain("guards the city gates");
  });

  it("includes entity type labels in context", () => {
    const chunks = [
      { chunk_text: "Some text", entity_type: "faction", entity_id: "fac-1" },
    ];
    const prompt = buildRagPrompt("Question", chunks);
    expect(prompt.userMessage).toContain("faction");
  });

  it("system prompt instructs grounded answers", () => {
    const prompt = buildRagPrompt("Question", []);
    expect(prompt.systemMessage).toContain("campaign");
    expect(prompt.systemMessage).toContain("context provided");
  });

  it("system prompt warns against inventing information", () => {
    const prompt = buildRagPrompt("Question", []);
    expect(prompt.systemMessage).toContain("do not invent");
  });

  it("handles empty context gracefully", () => {
    const prompt = buildRagPrompt("Random question", []);
    expect(prompt.userMessage).toContain("Random question");
    expect(prompt.userMessage).toContain("no relevant context");
  });
});
