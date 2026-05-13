import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveNewCharacter } from "./save-new-character";
import type { WizardState, CompendiumClass } from "./wizard-types";

function createMockState(overrides: Partial<WizardState> = {}): WizardState {
  return {
    name: "Kael Ashgrin",
    classId: "class-warrior-id",
    className: "Warrior",
    subclassId: "subclass-slayer-id",
    subclassName: "Call of the Slayer",
    ancestryName: "Katari",
    communityName: "Wanderborne",
    statValues: { agility: 3, strength: 2, finesse: 1, instinct: 1, presence: 0, knowledge: -1 },
    markedKeys: ["agility", "finesse"],
    selections: {},
    classConfig: {},
    ...overrides,
  };
}

const mockKatariFeatures = [
  {
    id: "feat-katari-instincts",
    name: "Katari: Feline Instincts",
    ability_type: "ancestry_feature",
    description: "When you make an Agility Roll, you can spend 2 Hope to reroll your Hope Die.",
    level: null,
    classes: null,
    data: { ancestry: "Katari", position: "top" },
  },
  {
    id: "feat-katari-claws",
    name: "Katari: Retracting Claws",
    ability_type: "ancestry_feature",
    description: "Make an Agility Roll to scratch a target within Melee range. On a success, they become temporarily Vulnerable.",
    level: null,
    classes: null,
    data: { ancestry: "Katari", position: "bottom" },
  },
];

const mockWanderborneFeatures = [
  {
    id: "feat-wanderborne",
    name: "Wanderborne: Nomadic Pack",
    ability_type: "community_feature",
    description: "Add a Nomadic Pack to your inventory. Once per session, you can spend a Hope to reach into this pack and pull out a mundane item.",
    level: null,
    classes: null,
    data: { community: "Wanderborne" },
  },
];

const mockWarrior: CompendiumClass = {
  id: "class-warrior-id",
  name: "Warrior",
  is_subclass: false,
  parent_class_id: null,
  hp_die: null,
  data: { domains: ["Blade", "Bone"], evasion: 11, hp_slots: 6, foundation_features: ["No Mercy"] },
  source: "Daggerheart SRD",
};

const mockSlayer: CompendiumClass = {
  id: "subclass-slayer-id",
  name: "Call of the Slayer",
  is_subclass: true,
  parent_class_id: "class-warrior-id",
  hp_die: null,
  data: {},
  source: "Daggerheart SRD",
};

describe("saveNewCharacter", () => {
  let mockSupabase: ReturnType<typeof createSupabaseMock>;

  function createSupabaseMock() {
    const insertResults: Record<string, { data: unknown; error: unknown }> = {
      characters: { data: { id: "new-char-id" }, error: null },
      character_classes: { data: null, error: null },
      character_stats: { data: null, error: null },
      character_resources: { data: null, error: null },
      character_abilities: { data: null, error: null },
    };

    // Capture the payload passed to .insert(...) per table so tests can assert on it
    const insertCalls: Record<string, unknown[]> = {};

    const deleteChain = {
      eq: vi.fn().mockResolvedValue({ error: null }),
    };

    return {
      from: vi.fn((table: string) => ({
        insert: vi.fn((payload: unknown) => {
          (insertCalls[table] ??= []).push(payload);
          return {
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue(insertResults[table] ?? { data: null, error: null }),
            })),
          };
        }),
        delete: vi.fn(() => deleteChain),
      })),
      _insertResults: insertResults,
      _insertCalls: insertCalls,
      _deleteChain: deleteChain,
    };
  }

  beforeEach(() => {
    mockSupabase = createSupabaseMock();
  });

  it("creates character and returns characterId", async () => {
    const result = await saveNewCharacter({
      supabase: mockSupabase as unknown as import("@supabase/supabase-js").SupabaseClient,
      campaignId: "campaign-1",
      systemId: "system-dh",
      userId: "user-1",
      wizardState: createMockState(),
      selectedClass: mockWarrior,
      selectedSubclass: mockSlayer,
    });

    expect(result.characterId).toBe("new-char-id");
  });

  it("calls from() for characters, character_classes, character_stats, character_resources", async () => {
    await saveNewCharacter({
      supabase: mockSupabase as unknown as import("@supabase/supabase-js").SupabaseClient,
      campaignId: "campaign-1",
      systemId: "system-dh",
      userId: "user-1",
      wizardState: createMockState(),
      selectedClass: mockWarrior,
      selectedSubclass: mockSlayer,
    });

    const tables = mockSupabase.from.mock.calls.map(([t]: [string]) => t);
    expect(tables).toContain("characters");
    expect(tables).toContain("character_classes");
    expect(tables).toContain("character_stats");
    expect(tables).toContain("character_resources");
  });

  it("throws on character insert failure", async () => {
    mockSupabase._insertResults.characters = {
      data: null,
      error: { message: "DB error" },
    };

    await expect(
      saveNewCharacter({
        supabase: mockSupabase as unknown as import("@supabase/supabase-js").SupabaseClient,
        campaignId: "campaign-1",
        systemId: "system-dh",
        userId: "user-1",
        wizardState: createMockState(),
        selectedClass: mockWarrior,
        selectedSubclass: mockSlayer,
      })
    ).rejects.toThrow("DB error");
  });

  it("rolls back (deletes character) on child table failure", async () => {
    // Make character_stats insert fail
    const charStatsChain = {
      insert: vi.fn().mockResolvedValue({ error: { message: "Stats failed" } }),
    };

    // Override from() to return different chains per table
    let callIndex = 0;
    const calls: Record<string, unknown> = {};
    (mockSupabase as Record<string, unknown>).from = vi.fn((table: string) => {
      callIndex++;
      if (table === "characters" && callIndex === 1) {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: { id: "new-char-id" }, error: null }),
            })),
          })),
          delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
        };
      }
      if (table === "character_classes") {
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      }
      if (table === "character_stats") {
        return charStatsChain;
      }
      if (table === "characters") {
        // This is the rollback delete call
        calls.deleteCall = true;
        return { delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })) };
      }
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    });

    await expect(
      saveNewCharacter({
        supabase: mockSupabase as unknown as import("@supabase/supabase-js").SupabaseClient,
        campaignId: "campaign-1",
        systemId: "system-dh",
        userId: "user-1",
        wizardState: createMockState(),
        selectedClass: mockWarrior,
        selectedSubclass: mockSlayer,
      })
    ).rejects.toThrow();
  });

  // ─── Heritage (ancestry + community) writes ────────────────

  it("writes ancestry and community names to characters.data", async () => {
    await saveNewCharacter({
      supabase: mockSupabase as unknown as import("@supabase/supabase-js").SupabaseClient,
      campaignId: "campaign-1",
      systemId: "system-dh",
      userId: "user-1",
      wizardState: createMockState(),
      selectedClass: mockWarrior,
      selectedSubclass: mockSlayer,
      ancestryFeatures: mockKatariFeatures,
      communityFeatures: mockWanderborneFeatures,
    });

    const charInsert = (mockSupabase._insertCalls.characters?.[0] ?? {}) as {
      data?: { ancestry?: string; community?: string };
    };
    expect(charInsert.data?.ancestry).toBe("Katari");
    expect(charInsert.data?.community).toBe("Wanderborne");
  });

  it("inserts a character_abilities row per ancestry feature and community feature with ability_ref_id", async () => {
    await saveNewCharacter({
      supabase: mockSupabase as unknown as import("@supabase/supabase-js").SupabaseClient,
      campaignId: "campaign-1",
      systemId: "system-dh",
      userId: "user-1",
      wizardState: createMockState(),
      selectedClass: mockWarrior,
      selectedSubclass: mockSlayer,
      ancestryFeatures: mockKatariFeatures,
      communityFeatures: mockWanderborneFeatures,
    });

    // save batches all ancestry + community features into a single .insert(rows) call
    const abilityInserts = mockSupabase._insertCalls.character_abilities ?? [];
    expect(abilityInserts).toHaveLength(1);
    const rows = abilityInserts[0] as Array<{
      ability_type: string;
      ability_ref_id: string;
      name: string;
    }>;
    expect(rows).toHaveLength(3); // 2 ancestry + 1 community

    const ancestryRows = rows.filter((r) => r.ability_type === "ancestry_feature");
    expect(ancestryRows).toHaveLength(2);
    expect(ancestryRows.map((r) => r.ability_ref_id).sort()).toEqual(
      ["feat-katari-claws", "feat-katari-instincts"].sort()
    );

    const communityRows = rows.filter((r) => r.ability_type === "community_feature");
    expect(communityRows).toHaveLength(1);
    expect(communityRows[0].ability_ref_id).toBe("feat-wanderborne");
  });

  it("does not insert heritage abilities when ancestryFeatures/communityFeatures are empty", async () => {
    await saveNewCharacter({
      supabase: mockSupabase as unknown as import("@supabase/supabase-js").SupabaseClient,
      campaignId: "campaign-1",
      systemId: "system-dh",
      userId: "user-1",
      wizardState: createMockState({ ancestryName: null, communityName: null }),
      selectedClass: mockWarrior,
      selectedSubclass: mockSlayer,
      ancestryFeatures: [],
      communityFeatures: [],
    });

    const abilityInserts = mockSupabase._insertCalls.character_abilities ?? [];
    expect(abilityInserts).toHaveLength(0);
  });
});
