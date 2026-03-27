/**
 * AI prompts for the 3-pass session extraction pipeline.
 *
 * Pass 1: Entity Extraction — identify new/updated NPCs, locations, factions, items
 * Pass 2: Event Extraction — extract narrative events, decisions, promises, todos
 * Pass 3: Conversation Extraction — extract dialogue with speaker attribution
 *
 * Each pass receives the entity manifest (all known entities with IDs and aliases)
 * so the AI can reference existing entities rather than creating duplicates.
 */

export interface EntityManifest {
  npcs: { id: string; name: string; aliases: string[] }[];
  locations: { id: string; name: string; aliases: string[] }[];
  factions: { id: string; name: string }[];
  items: { id: string; name: string }[];
}

function formatManifest(manifest: EntityManifest): string {
  const sections: string[] = [];

  if (manifest.npcs.length > 0) {
    sections.push(
      "KNOWN NPCs:\n" +
        manifest.npcs
          .map(
            (n) =>
              `  - ${n.name} (id: ${n.id})${n.aliases.length > 0 ? ` [aliases: ${n.aliases.join(", ")}]` : ""}`
          )
          .join("\n")
    );
  }

  if (manifest.locations.length > 0) {
    sections.push(
      "KNOWN LOCATIONS:\n" +
        manifest.locations
          .map(
            (l) =>
              `  - ${l.name} (id: ${l.id})${l.aliases.length > 0 ? ` [aliases: ${l.aliases.join(", ")}]` : ""}`
          )
          .join("\n")
    );
  }

  if (manifest.factions.length > 0) {
    sections.push(
      "KNOWN FACTIONS:\n" +
        manifest.factions.map((f) => `  - ${f.name} (id: ${f.id})`).join("\n")
    );
  }

  if (manifest.items.length > 0) {
    sections.push(
      "KNOWN ITEMS:\n" +
        manifest.items.map((i) => `  - ${i.name} (id: ${i.id})`).join("\n")
    );
  }

  return sections.length > 0
    ? sections.join("\n\n")
    : "No entities in the knowledge base yet.";
}

// ─── Pass 1: Entity Extraction ─────────────────────────────

export function buildEntityExtractionPrompt(manifest: EntityManifest) {
  const system = `You are a TTRPG session processing assistant. Your job is to read session notes and identify all entities (NPCs, locations, factions, items) that are mentioned — both new ones and updates to existing ones.

You will be given a list of KNOWN ENTITIES with their IDs and aliases. Check names AND aliases for fuzzy matches before creating a new entity.

Respond with JSON only, no markdown fences.

Response format:
{
  "new_npcs": [
    {
      "name": "Full name",
      "aliases": ["nickname", "title"],
      "description": "Physical appearance, personality, notable traits (2-4 sentences)",
      "status": "alive",
      "tags": ["merchant", "ally"],
      "gm_notes": "Hidden info the GM should track",
      "player_notes": "What the party knows about them",
      "source_excerpt": "Relevant quote from the notes"
    }
  ],
  "new_locations": [
    {
      "name": "Location name",
      "aliases": [],
      "description": "What it looks like, atmosphere, notable features (2-4 sentences)",
      "type": "city|town|village|dungeon|wilderness|building|district|region|other",
      "gm_notes": "Hidden info",
      "player_notes": "What the party knows",
      "source_excerpt": "Relevant quote from the notes"
    }
  ],
  "new_factions": [
    {
      "name": "Faction name",
      "description": "Who they are, what they do",
      "goals": "What they want",
      "gm_notes": "Hidden info",
      "player_notes": "What the party knows",
      "source_excerpt": "Relevant quote from the notes"
    }
  ],
  "new_items": [
    {
      "name": "Item name",
      "description": "What it is, what it does",
      "type": "weapon|armor|magical|quest|consumable|other",
      "gm_notes": "Hidden properties or history",
      "player_notes": "What the party knows",
      "source_excerpt": "Relevant quote from the notes"
    }
  ],
  "updated_entities": [
    {
      "entity_type": "npc|location|faction|item",
      "entity_id": "uuid of the existing entity",
      "entity_name": "Name for display",
      "changes": "Description of what changed",
      "source_excerpt": "Relevant quote from the notes"
    }
  ]
}

RULES:
- Any named character not in the manifest gets a new_npc entry, even if mentioned in passing. The GM rejects what's not needed — never pre-filter.
- Check aliases carefully. "The Bold One" might be an alias for "Gareth the Bold" — don't create duplicates.
- Populate every field the text supports. Sparse entries are useless.
- For updated_entities, describe what changed in natural language. The GM will apply the update manually.
- Only extract what's actually in the notes. Never invent information.`;

  return {
    system,
    buildUser: (notes: string) =>
      `${formatManifest(manifest)}\n\n---\n\nSESSION NOTES:\n${notes}`,
  };
}

// ─── Pass 2: Event Extraction ──────────────────────────────

export function buildEventExtractionPrompt(manifest: EntityManifest) {
  const system = `You are a TTRPG session processing assistant. Your job is to read session notes and extract narrative events — decisions, promises, discoveries, mood shifts, todos, and other notable moments.

You will be given a list of KNOWN ENTITIES. Reference them by name when tagging events.

Respond with JSON only, no markdown fences.

Response format:
{
  "events": [
    {
      "content": "Full description of what happened (2-4 sentences, written as if someone will read this with no other context months from now)",
      "summary": "One-sentence summary",
      "weight": 3,
      "event_type": "general|scene|decision|discovery|conversation|promise|todo|upcoming|milestone|mood|quote",
      "resolved": false,
      "trigger_condition": "When/if condition for future events (promises, todos, upcoming only)",
      "entity_tags": [
        { "name": "Entity Name", "role": "subject|target|location|witness|advances|complicates|resolves" }
      ],
      "source_excerpt": "Relevant quote from the notes"
    }
  ]
}

WEIGHT SCALE:
1 = ambient detail (the innkeeper sneezed)
2 = minor moment (a brief exchange)
3 = notable moment (a meaningful NPC interaction, a clue found)
4 = significant development (a deal struck, a secret revealed)
5 = major development (a battle outcome, a betrayal, an alliance formed)
6 = campaign-altering moment (a major character death, a war declared)
7 = campaign milestone (a BBEG defeated, a realm saved, an arc concluded)

EVENT TYPES:
- general: catch-all for moments that don't fit other types
- scene: a distinct scene or location change
- decision: the party made a meaningful choice
- discovery: information, lore, or secrets revealed
- conversation: summary of a notable exchange (the full dialogue goes in Pass 3)
- promise: an NPC-to-party or party-to-NPC commitment ("I'll pay you when the job is done")
- todo: something the party said they'd do or the GM needs to follow up on
- upcoming: a future event with a trigger condition ("When the full moon rises...")
- milestone: a quest completed, level gained, or arc concluded
- mood: a shift in NPC attitude, party morale, or narrative tone
- quote: a memorable line worth preserving verbatim

RULES:
- Extract one event per distinct moment/beat. Don't merge multiple events.
- For promises, todos, and upcoming events: ALWAYS include trigger_condition.
- For promises: explicitly note who promised what to whom.
- Tag ALL entities involved in each event. Never omit party members from events they participated in.
- Weight should reflect narrative importance, not how much text it gets in the notes.
- Only extract what's actually in the notes. Never invent information.`;

  return {
    system,
    buildUser: (notes: string) =>
      `${formatManifest(manifest)}\n\n---\n\nSESSION NOTES:\n${notes}`,
  };
}

// ─── Pass 3: Conversation Extraction ───────────────────────

export function buildConversationExtractionPrompt(manifest: EntityManifest) {
  const system = `You are a TTRPG session processing assistant. Your job is to read session notes and extract extended conversations or dialogues with speaker attribution and tone.

Only extract actual dialogues — not narration, not action descriptions. Look for direct speech, reported speech that can be reconstructed, and back-and-forth exchanges.

You will be given a list of KNOWN ENTITIES to help with speaker identification.

Respond with JSON only, no markdown fences.

Response format:
{
  "conversations": [
    {
      "title": "Brief label (e.g. 'Gareth interrogates the prisoner')",
      "participants": [
        { "name": "Speaker Name", "entity_type": "npc|character", "entity_id": "uuid if known, null if new" }
      ],
      "turns": [
        { "speaker": "Speaker Name", "text": "What they said", "tone": "friendly|hostile|nervous|defensive|pleading|commanding|sarcastic|whispering|shouting|neutral" }
      ],
      "summary": "One-sentence summary of the conversation and its outcome",
      "source_excerpt": "Relevant quote from the notes"
    }
  ]
}

RULES:
- Narrow scope, high accuracy. Only dialogues, not narration.
- Preserve the actual words as closely as possible. If the notes paraphrase, reconstruct reasonable dialogue.
- Include tone tags for each turn to capture how things were said.
- The summary should capture the outcome or significance of the conversation.
- Match speaker names to known entities when possible. Use entity_id from the manifest.
- Only extract what's actually in the notes. Never invent conversations.`;

  return {
    system,
    buildUser: (notes: string) =>
      `${formatManifest(manifest)}\n\n---\n\nSESSION NOTES:\n${notes}`,
  };
}
