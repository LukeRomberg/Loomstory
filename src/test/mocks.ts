import { vi } from "vitest";

// ─── Supabase Client Mock ───────────────────────────────────

export function createMockSupabaseClient(overrides: Record<string, unknown> = {}) {
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  };

  return {
    from: vi.fn(() => mockChain),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "test-user-id", email: "test@loomstory.app" } },
      }),
      signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
    rpc: vi.fn().mockResolvedValue({ data: {}, error: null }),
    _chain: mockChain,
  };
}

// ─── Mock Data ──────────────────────────────────────────────

export const mockProfile = {
  id: "test-user-id",
  display_name: "Test GM",
  avatar_url: null,
  bio: null,
};

export const mockCampaign = {
  id: "campaign-1",
  name: "The Crimson Accord",
  description: "A tale of intrigue and betrayal",
  system_id: "system-dnd5e",
  cover_image_url: null,
  house_rules: null,
  created_by: "test-user-id",
  created_at: "2026-03-27T00:00:00Z",
};

export const mockSession = {
  id: "session-1",
  campaign_id: "campaign-1",
  title: "The Siege of Ironhold",
  date_played: "2026-03-20",
  session_number: 1,
  raw_notes: "<p>The party arrived at Ironhold...</p>",
  ai_summary: null,
  gm_notes: null,
  player_summary: null,
  player_visible: false,
  status: "draft",
  created_by: "test-user-id",
};

export const mockNpc = {
  id: "npc-1",
  campaign_id: "campaign-1",
  name: "Gareth the Bold",
  aliases: ["Gareth", "The Bold One"],
  description: "A tall, scarred warrior with a commanding presence",
  status: "alive",
  tags: ["ally", "warrior"],
  gm_notes: "Secretly working for the enemy",
  player_notes: "Helped the party at the bridge",
  gm_only: false,
  portrait_url: null,
  last_location_id: null,
};

export const mockLocation = {
  id: "location-1",
  campaign_id: "campaign-1",
  name: "Ironhold",
  aliases: ["The Iron City"],
  description: "A fortified city perched on a mountain pass",
  type: "city",
  gm_notes: null,
  player_notes: null,
  gm_only: false,
};

export const mockFaction = {
  id: "faction-1",
  campaign_id: "campaign-1",
  name: "The Crimson Hand",
  description: "A shadowy guild of assassins",
  goals: "Control the northern trade routes",
  gm_notes: "Their leader is a vampire",
  player_notes: null,
  gm_only: true,
};

export const mockEvent = {
  id: "event-1",
  campaign_id: "campaign-1",
  session_id: "session-1",
  content: "The party arrived at Ironhold and were greeted by Gareth at the city gates. He warned them about the Crimson Hand's growing influence.",
  summary: "Party arrives at Ironhold",
  weight: 3,
  event_type: "scene",
  narrative_day: 1,
  narrative_time: 900,
  sequence: 0,
  resolved: false,
  trigger_condition: null,
  gm_only: true,
  created_at: "2026-03-27T00:00:00Z",
};

export const mockEventWithTags = {
  ...mockEvent,
  entity_tags: [
    { entity_type: "npc", entity_id: "npc-1", entity_name: "Gareth the Bold", role: "subject" },
    { entity_type: "location", entity_id: "location-1", entity_name: "Ironhold", role: "location" },
  ],
};

export const mockEvents = [
  mockEvent,
  {
    id: "event-2",
    campaign_id: "campaign-1",
    session_id: "session-1",
    content: "Gareth promised to provide safe passage through the mountains if the party dealt with the bandit camp.",
    summary: "Gareth's promise of safe passage",
    weight: 4,
    event_type: "promise",
    narrative_day: 1,
    narrative_time: 1200,
    sequence: 0,
    resolved: false,
    trigger_condition: "When the party clears the bandit camp",
    gm_only: true,
    created_at: "2026-03-27T00:00:00Z",
  },
  {
    id: "event-3",
    campaign_id: "campaign-1",
    session_id: null,
    content: "The Crimson Hand assassinated the mayor of Thornwall.",
    summary: "Mayor assassinated",
    weight: 5,
    event_type: "milestone",
    narrative_day: -10,
    narrative_time: null,
    sequence: 0,
    resolved: true,
    trigger_condition: null,
    gm_only: true,
    created_at: "2026-03-27T00:00:00Z",
  },
];

export const mockSessions = [
  {
    id: "session-1",
    title: "The Siege of Ironhold",
    session_number: 1,
  },
  {
    id: "session-2",
    title: "Into the Mountains",
    session_number: 2,
  },
];

export const mockConversation = {
  id: "conv-1",
  campaign_id: "campaign-1",
  session_id: "session-1",
  event_id: null,
  title: "Gareth warns the party",
  participants: [
    { entity_id: "npc-1", entity_type: "npc", name: "Gareth the Bold" },
    { entity_id: null, entity_type: "character", name: "Durk" },
  ],
  content: [
    { speaker: "Gareth", text: "The Crimson Hand has eyes everywhere. You'd best watch your backs.", tone: "nervous" },
    { speaker: "Durk", text: "We've faced worse. What can you tell us about their leader?", tone: "confident" },
    { speaker: "Gareth", text: "They call her the Veil. No one has seen her face and lived.", tone: "whispering" },
  ],
  content_plain: "Gareth: The Crimson Hand has eyes everywhere. You'd best watch your backs.\nDurk: We've faced worse. What can you tell us about their leader?\nGareth: They call her the Veil. No one has seen her face and lived.",
  gm_notes: "Gareth is lying — he knows more than he's saying",
  gm_only: true,
  created_at: "2026-03-27T00:00:00Z",
};

export const mockConversations = [
  mockConversation,
  {
    id: "conv-2",
    campaign_id: "campaign-1",
    session_id: "session-1",
    event_id: null,
    title: "Negotiating passage at the gate",
    participants: [
      { entity_id: null, entity_type: "character", name: "Durk" },
      { entity_id: "npc-2", entity_type: "npc", name: "Gate Captain Hale" },
    ],
    content: [
      { speaker: "Hale", text: "No one enters without the Warden's seal.", tone: "commanding" },
      { speaker: "Durk", text: "We carry word from the southern villages. The Warden will want to hear this.", tone: "persuasive" },
      { speaker: "Hale", text: "...fine. But I'll be watching you.", tone: "suspicious" },
    ],
    content_plain: "Hale: No one enters without the Warden's seal.\nDurk: We carry word from the southern villages. The Warden will want to hear this.\nHale: ...fine. But I'll be watching you.",
    gm_notes: null,
    gm_only: true,
    created_at: "2026-03-27T00:01:00Z",
  },
];

export const mockRelations = [
  {
    id: "rel-1",
    campaign_id: "campaign-1",
    source_type: "npc",
    source_id: "npc-1",
    target_type: "faction",
    target_id: "faction-1",
    relation_type: "member_of",
    description: "Secret member since the founding",
    source_name: "Gareth the Bold",
    target_name: "The Crimson Hand",
  },
  {
    id: "rel-2",
    campaign_id: "campaign-1",
    source_type: "npc",
    source_id: "npc-1",
    target_type: "location",
    target_id: "location-1",
    relation_type: "located_in",
    description: "Currently stationed at the city gates",
    source_name: "Gareth the Bold",
    target_name: "Ironhold",
  },
  {
    id: "rel-3",
    campaign_id: "campaign-1",
    source_type: "faction",
    source_id: "faction-1",
    target_type: "location",
    target_id: "location-1",
    relation_type: "hostile_to",
    description: "Planning to siege the city",
    source_name: "The Crimson Hand",
    target_name: "Ironhold",
  },
];

export const mockRelationTypes = [
  { id: "member_of", label: "Member Of" },
  { id: "allied_with", label: "Allied With" },
  { id: "hostile_to", label: "Hostile To" },
  { id: "located_in", label: "Located In" },
  { id: "owns", label: "Owns" },
  { id: "knows", label: "Knows" },
  { id: "reports_to", label: "Reports To" },
  { id: "parent_of", label: "Parent Of" },
  { id: "sibling_of", label: "Sibling Of" },
  { id: "employs", label: "Employs" },
];

export const mockSystems = [
  { id: "system-dnd5e", name: "Dungeons & Dragons 5e", slug: "dnd5e" },
  { id: "system-pf2e", name: "Pathfinder 2e", slug: "pf2e" },
  { id: "system-daggerheart", name: "Daggerheart", slug: "daggerheart" },
  { id: "system-custom", name: "Custom", slug: "custom" },
];

export const mockExtractionData = {
  entities: {
    new_npcs: [
      {
        name: "Marta the Innkeeper",
        aliases: ["Marta"],
        description: "A stout woman with kind eyes",
        status: "alive",
        tags: ["merchant", "ally"],
        gm_notes: null,
        player_notes: "Runs the Silver Hart tavern",
        source_excerpt: "They met Marta at the inn",
      },
    ],
    new_locations: [
      {
        name: "The Silver Hart",
        aliases: [],
        description: "A cozy tavern with a roaring fireplace",
        type: "building",
        gm_notes: null,
        player_notes: null,
        source_excerpt: "The party entered the Silver Hart",
      },
    ],
    new_factions: [],
    new_items: [],
  },
  events: {
    events: [
      {
        content: "The party arrived at Ironhold and met Marta at the Silver Hart tavern",
        summary: "Party arrives at Ironhold",
        weight: 3,
        event_type: "scene",
        resolved: false,
        trigger_condition: null,
        entity_tags: [{ name: "Marta the Innkeeper", role: "subject" }],
        source_excerpt: "The party arrived at Ironhold",
      },
    ],
  },
  conversations: {
    conversations: [
      {
        title: "Marta warns the party",
        summary: "Marta warns about bandits on the road north",
        participants: [{ name: "Marta", entity_type: "npc" }],
        turns: [
          { speaker: "Marta", text: "You'd best be careful on the north road.", tone: "nervous" },
          { speaker: "Gareth", text: "We can handle ourselves.", tone: "confident" },
        ],
        source_excerpt: "Marta warned them about the bandits",
      },
    ],
  },
};

export const mockEntityHistory = {
  events: [
    {
      id: "event-1",
      content: "Gareth warned the party about the Crimson Hand's growing influence.",
      summary: "Gareth warns the party",
      weight: 3,
      event_type: "scene",
      narrative_day: 1,
      narrative_time: 900,
      resolved: false,
      created_at: "2026-03-27T00:00:00Z",
      role: "subject",
    },
    {
      id: "event-2",
      content: "Gareth promised safe passage through the mountains.",
      summary: "Gareth's promise of safe passage",
      weight: 4,
      event_type: "promise",
      narrative_day: 1,
      narrative_time: 1200,
      resolved: false,
      created_at: "2026-03-27T00:01:00Z",
      role: "subject",
    },
  ],
  conversations: [
    {
      id: "conv-1",
      title: "Gareth warns the party",
      participants: [
        { name: "Gareth the Bold", entity_type: "npc" },
        { name: "Durk", entity_type: "character" },
      ],
      turn_count: 3,
      created_at: "2026-03-27T00:00:00Z",
    },
  ],
  session_mentions: [
    {
      session_id: "session-1",
      session_title: "The Siege of Ironhold",
      session_number: 1,
      mention_type: "introduced",
      created_at: "2026-03-27T00:00:00Z",
    },
  ],
};

export const mockPlotThread = {
  id: "thread-1",
  campaign_id: "campaign-1",
  title: "The Crimson Conspiracy",
  description: "The Crimson Hand is secretly infiltrating the city guard to overthrow the Warden.",
  status: "active",
  priority: "main",
  resolution_notes: null,
  gm_notes: "The Veil is the Warden's own daughter",
  gm_only: true,
};

export const mockPlotThreads = [
  mockPlotThread,
  {
    id: "thread-2",
    campaign_id: "campaign-1",
    title: "The Missing Miners",
    description: "Miners from Ironhold have been disappearing into the deep tunnels.",
    status: "active",
    priority: "side",
    resolution_notes: null,
    gm_notes: null,
    gm_only: false,
  },
  {
    id: "thread-3",
    campaign_id: "campaign-1",
    title: "The Dragon's Debt",
    description: "The party owes a favor to the bronze dragon Vexilrath.",
    status: "on_hold",
    priority: "background",
    resolution_notes: null,
    gm_notes: "Vexilrath will call in the favor at the worst possible time",
    gm_only: true,
  },
];

export const mockItem = {
  id: "item-1",
  campaign_id: "campaign-1",
  name: "Flame Tongue Longsword",
  description: "A magical longsword that ignites with flame on command.",
  type: "weapon",
  mechanical_properties: { damage: "1d8+2d6 fire", properties: ["versatile", "magical"] },
  gm_notes: "Cursed — the wielder hears whispers when alone",
  player_notes: "Found in the dragon's hoard",
  gm_only: false,
};

export const mockItems = [
  mockItem,
  {
    id: "item-2",
    campaign_id: "campaign-1",
    name: "Sealed Letter",
    description: "A letter sealed with the Warden's sigil, addressed to someone in the capital.",
    type: "document",
    mechanical_properties: null,
    gm_notes: "Contains evidence of the Warden's treason",
    player_notes: "Found on the assassin's body",
    gm_only: true,
  },
];

export const mockLoreEntry = {
  id: "lore-1",
  campaign_id: "campaign-1",
  title: "The Founding of Ironhold",
  content: "Ironhold was founded 300 years ago by dwarven miners who discovered rich veins of iron in the mountain pass. The city grew around the mines and became a critical trade hub between the northern and southern kingdoms.",
  tags: ["history", "ironhold", "dwarves"],
  gm_only: false,
};

export const mockLoreEntries = [
  mockLoreEntry,
  {
    id: "lore-2",
    campaign_id: "campaign-1",
    title: "The Veil's True Identity",
    content: "The Veil, leader of the Crimson Hand, is actually Sera Thornwall — the Warden's estranged daughter who was exiled after discovering her father's corruption.",
    tags: ["crimson hand", "secrets"],
    gm_only: true,
  },
];

export const mockEntityVersions = [
  {
    id: "ver-3",
    entity_type: "npc",
    entity_id: "npc-1",
    version_number: 3,
    snapshot: {
      name: "Gareth the Bold",
      status: "alive",
      description: "A tall, scarred warrior with a commanding presence",
      gm_notes: "Secretly working for the enemy",
    },
    change_summary: null,
    changed_by: "user-1",
    changed_by_name: "Luke",
    changed_at: "2026-03-28T12:00:00Z",
  },
  {
    id: "ver-2",
    entity_type: "npc",
    entity_id: "npc-1",
    version_number: 2,
    snapshot: {
      name: "Gareth the Bold",
      status: "alive",
      description: "A tall warrior with a scar across his face",
      aliases: [],
      gm_notes: null,
    },
    change_summary: null,
    changed_by: "user-1",
    changed_by_name: "Luke",
    changed_at: "2026-03-27T18:00:00Z",
  },
  {
    id: "ver-1",
    entity_type: "npc",
    entity_id: "npc-1",
    version_number: 1,
    snapshot: {
      name: "Gareth",
      status: "alive",
      description: "A warrior at the gates",
      aliases: [],
      gm_notes: null,
    },
    change_summary: null,
    changed_by: "user-1",
    changed_by_name: "System",
    changed_at: "2026-03-27T00:00:00Z",
  },
];
