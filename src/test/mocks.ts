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
