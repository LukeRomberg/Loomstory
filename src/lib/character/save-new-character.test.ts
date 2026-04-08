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
    textFields: { ancestry: "Katari", community: "Wanderborne" },
    statValues: { agility: 3, strength: 2, finesse: 1, instinct: 1, presence: 0, knowledge: -1 },
    markedKeys: ["agility", "finesse"],
    selections: {},
    classConfig: {},
    ...overrides,
  };
}

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
    };

    const deleteChain = {
      eq: vi.fn().mockResolvedValue({ error: null }),
    };

    return {
      from: vi.fn((table: string) => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue(insertResults[table] ?? { data: null, error: null }),
          })),
        })),
        delete: vi.fn(() => deleteChain),
      })),
      _insertResults: insertResults,
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
    mockSupabase.from = vi.fn((table: string) => {
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
});
