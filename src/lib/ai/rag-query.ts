/**
 * RAG Query — builds the prompt for AI-powered campaign questions.
 * Retrieves relevant context via pgvector similarity search,
 * then sends question + context to Claude.
 */

interface ContextChunk {
  chunk_text: string;
  entity_type: string;
  entity_id: string;
}

export function buildRagPrompt(
  question: string,
  chunks: ContextChunk[]
): { systemMessage: string; userMessage: string } {
  const systemMessage = `You are a knowledgeable assistant for a tabletop RPG campaign. Your job is to answer the GM's questions using ONLY the campaign context provided below.

RULES:
- Answer based on the context provided. If the context contains the answer, give a thorough response.
- If the context does not contain enough information, say so clearly — do not invent or speculate beyond what the data shows.
- Reference specific NPCs, locations, events, and conversations by name when relevant.
- Keep answers concise but complete. Use bullet points for lists.
- Write in a tone appropriate for a fantasy RPG setting.`;

  let contextBlock: string;

  if (chunks.length === 0) {
    contextBlock = "CAMPAIGN CONTEXT:\n(no relevant context found in the knowledge base for this question)\n";
  } else {
    const formattedChunks = chunks
      .map(
        (c, i) =>
          `[Source ${i + 1} — ${c.entity_type}]\n${c.chunk_text}`
      )
      .join("\n\n");
    contextBlock = `CAMPAIGN CONTEXT:\n${formattedChunks}\n`;
  }

  const userMessage = `${contextBlock}\n---\n\nQUESTION: ${question}`;

  return { systemMessage, userMessage };
}
