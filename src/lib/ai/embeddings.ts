/**
 * RAG Embedding Pipeline
 *
 * Handles text chunking, content building for each entity type,
 * and embedding generation via Voyage AI.
 */

// ─── Constants ──────────────────────────────────────────────

/** Approximate token count per chunk (1 word ≈ 1 token for estimation) */
export const CHUNK_SIZE = 800;
/** Overlap between adjacent chunks */
export const CHUNK_OVERLAP = 100;

// ─── Chunking ───────────────────────────────────────────────

/**
 * Splits text into chunks of ~CHUNK_SIZE words with ~CHUNK_OVERLAP overlap.
 * Short text (< CHUNK_SIZE words) returns as a single chunk.
 */
export function chunkText(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const words = trimmed.split(/\s+/);
  if (words.length <= CHUNK_SIZE) return [trimmed];

  const chunks: string[] = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + CHUNK_SIZE, words.length);
    chunks.push(words.slice(start, end).join(" "));
    if (end >= words.length) break;
    start = end - CHUNK_OVERLAP;
  }

  return chunks;
}

// ─── Content Building ───────────────────────────────────────

/**
 * Builds a single text string from an entity's fields for embedding.
 * Each entity type has its own field selection — we embed narrative
 * content, not structured/numeric data.
 */
export function buildEmbeddingContent(
  entityType: string,
  data: Record<string, unknown>
): string {
  const parts: string[] = [];

  function add(label: string, value: unknown) {
    if (value && typeof value === "string" && value.trim()) {
      parts.push(`${label}: ${value.trim()}`);
    }
  }

  switch (entityType) {
    case "npc":
      add("Name", data.name);
      add("Description", data.description);
      add("Appearance", data.appearance);
      add("Voice & Mannerisms", data.voice_notes);
      add("Personality", data.personality);
      add("GM Notes", data.gm_notes);
      add("Player Notes", data.player_notes);
      break;

    case "location":
      add("Name", data.name);
      add("Type", data.type);
      add("Description", data.description);
      add("GM Notes", data.gm_notes);
      add("Player Notes", data.player_notes);
      break;

    case "faction":
      add("Name", data.name);
      add("Description", data.description);
      add("Goals", data.goals);
      add("GM Notes", data.gm_notes);
      add("Player Notes", data.player_notes);
      break;

    case "plot_thread":
      add("Title", data.title);
      add("Description", data.description);
      add("Resolution Notes", data.resolution_notes);
      add("GM Notes", data.gm_notes);
      break;

    case "item":
      add("Name", data.name);
      add("Description", data.description);
      add("GM Notes", data.gm_notes);
      add("Player Notes", data.player_notes);
      break;

    case "lore_entry":
      add("Title", data.title);
      add("Content", data.content);
      break;

    case "event":
      add("Summary", data.summary);
      add("Content", data.content);
      break;

    case "conversation":
      add("Title", data.title);
      add("Content", data.content_plain);
      break;

    case "session":
      add("Title", data.title);
      add("Notes", data.raw_notes);
      add("Summary", data.ai_summary);
      add("Player Summary", data.player_summary);
      add("GM Notes", data.gm_notes);
      break;

    default:
      return "";
  }

  return parts.join("\n");
}

// ─── Voyage AI Embedding ────────────────────────────────────

/**
 * Generates embeddings for an array of text chunks via Voyage AI.
 * Returns an array of 1536-dimension vectors.
 */
export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const response = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      input: texts,
      model: "voyage-3-lite",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Voyage AI error:", error);
    throw new Error(`Voyage AI embedding failed: ${response.status}`);
  }

  const result = await response.json();
  return result.data.map((d: { embedding: number[] }) => d.embedding);
}

// ─── Full Embed Pipeline ────────────────────────────────────

interface EmbedEntityParams {
  campaignId: string;
  entityType: string;
  entityId: string;
  data: Record<string, unknown>;
  gmOnly: boolean;
  supabase: {
    from: (table: string) => {
      delete: () => { eq: (col: string, val: string) => { eq: (col: string, val: string) => Promise<unknown> } };
      insert: (rows: unknown[]) => Promise<{ error: unknown }>;
    };
  };
}

/**
 * Full pipeline: build content → chunk → embed → store.
 * Deletes existing embeddings for this entity first, then inserts new ones.
 */
export async function embedEntity({
  campaignId,
  entityType,
  entityId,
  data,
  gmOnly,
  supabase,
}: EmbedEntityParams): Promise<number> {
  // Build text content
  const content = buildEmbeddingContent(entityType, data);
  if (!content) return 0;

  // Strip HTML tags if present
  const plainContent = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!plainContent) return 0;

  // Chunk
  const chunks = chunkText(plainContent);
  if (chunks.length === 0) return 0;

  // Generate embeddings
  const embeddings = await generateEmbeddings(chunks);

  // Delete existing embeddings for this entity
  await supabase
    .from("embeddings")
    .delete()
    .eq("entity_type", entityType)
    .eq("entity_id", entityId);

  // Insert new embeddings
  const rows = chunks.map((chunk, i) => ({
    campaign_id: campaignId,
    entity_type: entityType,
    entity_id: entityId,
    chunk_index: i,
    chunk_text: chunk,
    embedding: JSON.stringify(embeddings[i]),
    gm_only: gmOnly,
    metadata: {},
  }));

  const { error } = await supabase.from("embeddings").insert(rows);
  if (error) {
    console.error("Failed to insert embeddings:", error);
    return 0;
  }

  return chunks.length;
}
