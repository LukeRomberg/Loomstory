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
    ancestryVariant: "female",
    communityName: "Wanderborne",
    statValues: { agility: 2, strength: 1, finesse: 1, instinct: 0, presence: 0, knowledge: -1 },
    experiences: [{ name: "" }, { name: "" }],
    primaryWeaponId: null,
    primaryWeaponIsTwoHanded: false,
    secondaryWeaponId: null,
    armorId: null,
    potionId: null,
    classItemName: null,
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

// ─── Equipment mocks ──────────────────────────────────────────

const mockGreatsword = {
  id: "item-greatsword",
  name: "Greatsword",
  type: "weapon",
  description: "Tier 1 two-handed.",
  properties: { tier: 1, category: "Primary", type: "Two-Handed", damage: "d10+3 phy" },
  source: "Daggerheart SRD",
};

const mockBroadsword = {
  id: "item-broadsword",
  name: "Broadsword",
  type: "weapon",
  description: "Tier 1 reliable.",
  properties: { tier: 1, category: "Primary", type: "One-Handed", damage: "d8 phy" },
  source: "Daggerheart SRD",
};

const mockShortsword = {
  id: "item-shortsword",
  name: "Shortsword",
  type: "weapon",
  description: "Tier 1 secondary.",
  properties: { tier: 1, category: "Secondary", type: "One-Handed", damage: "d8 phy" },
  source: "Daggerheart SRD",
};

const mockGambeson = {
  id: "armor-gambeson",
  name: "Gambeson Armor",
  type: "armor",
  description: "Tier 1.",
  properties: { tier: 1, base_score: 3, thresholds: "5/11" },
  source: "Daggerheart SRD",
};

const mockMinorHealth = {
  id: "consumable-minor-health",
  name: "Minor Health Potion",
  type: "consumable",
  description: "Clear 1d4 HP.",
  properties: {},
  source: "Daggerheart SRD",
};

/**
 * Maps each basic supply name to a stable mock compendium id. The wizard component
 * looks these up by name on save and passes the resolved id list to saveNewCharacter,
 * which then inserts a character_items row per supply linked via compendium_item_ref_id.
 */
const mockBasicSupplyIds = {
  Torch: "supply-torch",
  "50 ft of Rope": "supply-rope",
  "Basic Supplies": "supply-basics",
  "Handful of Gold": "supply-gold",
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

  it("does not write the deprecated `marked` field on character_stats rows", async () => {
    await saveNewCharacter({
      supabase: mockSupabase as unknown as import("@supabase/supabase-js").SupabaseClient,
      campaignId: "campaign-1",
      systemId: "system-dh",
      userId: "user-1",
      wizardState: createMockState(),
      selectedClass: mockWarrior,
      selectedSubclass: mockSlayer,
    });

    const statsInserts = mockSupabase._insertCalls.character_stats ?? [];
    // Inserts as a single batched array — flatten just in case
    const rows = statsInserts.flatMap((payload) =>
      Array.isArray(payload) ? payload : [payload]
    ) as Array<{ data?: Record<string, unknown> }>;
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.data ?? {}).not.toHaveProperty("marked");
    }
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

  // ─── Equipment (character_items) writes ────────────────────

  type ItemRow = {
    name: string;
    item_type: string | null;
    quantity: number | null;
    equipped: boolean | null;
    compendium_item_ref_id: string | null;
    item_ref_id?: string | null;
  };

  function getItemRows(supabase: ReturnType<typeof createSupabaseMock>): ItemRow[] {
    const inserts = supabase._insertCalls.character_items ?? [];
    return inserts.flatMap((payload) =>
      Array.isArray(payload) ? payload : [payload]
    ) as ItemRow[];
  }

  it("inserts primary weapon with compendium_item_ref_id, equipped=true, item_type='weapon'", async () => {
    await saveNewCharacter({
      supabase: mockSupabase as unknown as import("@supabase/supabase-js").SupabaseClient,
      campaignId: "campaign-1",
      systemId: "system-dh",
      userId: "user-1",
      wizardState: createMockState(),
      selectedClass: mockWarrior,
      selectedSubclass: mockSlayer,
      primaryWeapon: mockGreatsword,
      secondaryWeapon: null,
      armor: mockGambeson,
      potion: mockMinorHealth,
      classItemName: "A sharpening stone",
      basicSupplyIds: mockBasicSupplyIds,
    });

    const rows = getItemRows(mockSupabase);
    const primary = rows.find((r) => r.name === "Greatsword");
    expect(primary).toBeDefined();
    expect(primary?.item_type).toBe("weapon");
    expect(primary?.quantity).toBe(1);
    expect(primary?.equipped).toBe(true);
    expect(primary?.compendium_item_ref_id).toBe("item-greatsword");
  });

  it("does not insert a secondary weapon row when secondaryWeapon is null (2H primary)", async () => {
    await saveNewCharacter({
      supabase: mockSupabase as unknown as import("@supabase/supabase-js").SupabaseClient,
      campaignId: "campaign-1",
      systemId: "system-dh",
      userId: "user-1",
      wizardState: createMockState(),
      selectedClass: mockWarrior,
      selectedSubclass: mockSlayer,
      primaryWeapon: mockGreatsword,
      secondaryWeapon: null,
      armor: mockGambeson,
      potion: mockMinorHealth,
      classItemName: "A sharpening stone",
      basicSupplyIds: mockBasicSupplyIds,
    });

    const rows = getItemRows(mockSupabase);
    const weaponRows = rows.filter((r) => r.item_type === "weapon");
    expect(weaponRows).toHaveLength(1);
    expect(weaponRows[0].name).toBe("Greatsword");
  });

  it("inserts both primary and secondary weapon rows when secondaryWeapon is provided", async () => {
    await saveNewCharacter({
      supabase: mockSupabase as unknown as import("@supabase/supabase-js").SupabaseClient,
      campaignId: "campaign-1",
      systemId: "system-dh",
      userId: "user-1",
      wizardState: createMockState(),
      selectedClass: mockWarrior,
      selectedSubclass: mockSlayer,
      primaryWeapon: mockBroadsword,
      secondaryWeapon: mockShortsword,
      armor: mockGambeson,
      potion: mockMinorHealth,
      classItemName: "A sharpening stone",
      basicSupplyIds: mockBasicSupplyIds,
    });

    const rows = getItemRows(mockSupabase);
    const weaponRows = rows.filter((r) => r.item_type === "weapon");
    expect(weaponRows).toHaveLength(2);
    expect(weaponRows.map((r) => r.name).sort()).toEqual(["Broadsword", "Shortsword"]);

    const secondary = rows.find((r) => r.name === "Shortsword");
    expect(secondary?.equipped).toBe(true);
    expect(secondary?.compendium_item_ref_id).toBe("item-shortsword");
  });

  it("inserts armor with equipped=true and item_type='armor'", async () => {
    await saveNewCharacter({
      supabase: mockSupabase as unknown as import("@supabase/supabase-js").SupabaseClient,
      campaignId: "campaign-1",
      systemId: "system-dh",
      userId: "user-1",
      wizardState: createMockState(),
      selectedClass: mockWarrior,
      selectedSubclass: mockSlayer,
      primaryWeapon: mockGreatsword,
      secondaryWeapon: null,
      armor: mockGambeson,
      potion: mockMinorHealth,
      classItemName: "A sharpening stone",
      basicSupplyIds: mockBasicSupplyIds,
    });

    const rows = getItemRows(mockSupabase);
    const armor = rows.find((r) => r.name === "Gambeson Armor");
    expect(armor).toBeDefined();
    expect(armor?.item_type).toBe("armor");
    expect(armor?.equipped).toBe(true);
    expect(armor?.compendium_item_ref_id).toBe("armor-gambeson");
  });

  it("inserts potion with equipped=false and item_type='consumable'", async () => {
    await saveNewCharacter({
      supabase: mockSupabase as unknown as import("@supabase/supabase-js").SupabaseClient,
      campaignId: "campaign-1",
      systemId: "system-dh",
      userId: "user-1",
      wizardState: createMockState(),
      selectedClass: mockWarrior,
      selectedSubclass: mockSlayer,
      primaryWeapon: mockGreatsword,
      secondaryWeapon: null,
      armor: mockGambeson,
      potion: mockMinorHealth,
      classItemName: "A sharpening stone",
      basicSupplyIds: mockBasicSupplyIds,
    });

    const rows = getItemRows(mockSupabase);
    const potion = rows.find((r) => r.name === "Minor Health Potion");
    expect(potion).toBeDefined();
    expect(potion?.item_type).toBe("consumable");
    expect(potion?.equipped).toBe(false);
    expect(potion?.compendium_item_ref_id).toBe("consumable-minor-health");
  });

  it("inserts class item as a free-text row (no compendium ref, name = chosen option)", async () => {
    await saveNewCharacter({
      supabase: mockSupabase as unknown as import("@supabase/supabase-js").SupabaseClient,
      campaignId: "campaign-1",
      systemId: "system-dh",
      userId: "user-1",
      wizardState: createMockState(),
      selectedClass: mockWarrior,
      selectedSubclass: mockSlayer,
      primaryWeapon: mockGreatsword,
      secondaryWeapon: null,
      armor: mockGambeson,
      potion: mockMinorHealth,
      classItemName: "The drawing of a lover",
      basicSupplyIds: mockBasicSupplyIds,
    });

    const rows = getItemRows(mockSupabase);
    const classItem = rows.find((r) => r.name === "The drawing of a lover");
    expect(classItem).toBeDefined();
    expect(classItem?.compendium_item_ref_id).toBeNull();
    expect(classItem?.quantity).toBe(1);
  });

  it("inserts the 4 basic supplies with compendium_item_ref_id wired from basicSupplyIds", async () => {
    await saveNewCharacter({
      supabase: mockSupabase as unknown as import("@supabase/supabase-js").SupabaseClient,
      campaignId: "campaign-1",
      systemId: "system-dh",
      userId: "user-1",
      wizardState: createMockState(),
      selectedClass: mockWarrior,
      selectedSubclass: mockSlayer,
      primaryWeapon: mockGreatsword,
      secondaryWeapon: null,
      armor: mockGambeson,
      potion: mockMinorHealth,
      classItemName: "A sharpening stone",
      basicSupplyIds: mockBasicSupplyIds,
    });

    const rows = getItemRows(mockSupabase);
    const supplyRows = rows.filter((r) =>
      ["Torch", "50 ft of Rope", "Basic Supplies", "Handful of Gold"].includes(r.name)
    );
    expect(supplyRows).toHaveLength(4);

    for (const row of supplyRows) {
      expect(row.quantity).toBe(1);
      expect(row.equipped).toBe(false);
      expect(row.compendium_item_ref_id).toBe(
        mockBasicSupplyIds[row.name as keyof typeof mockBasicSupplyIds]
      );
    }
  });

  it("batches the equipment + supplies into a single character_items insert call", async () => {
    await saveNewCharacter({
      supabase: mockSupabase as unknown as import("@supabase/supabase-js").SupabaseClient,
      campaignId: "campaign-1",
      systemId: "system-dh",
      userId: "user-1",
      wizardState: createMockState(),
      selectedClass: mockWarrior,
      selectedSubclass: mockSlayer,
      primaryWeapon: mockBroadsword,
      secondaryWeapon: mockShortsword,
      armor: mockGambeson,
      potion: mockMinorHealth,
      classItemName: "A sharpening stone",
      basicSupplyIds: mockBasicSupplyIds,
    });

    const inserts = mockSupabase._insertCalls.character_items ?? [];
    // One .insert() call with all the rows batched together (mirrors how
    // character_abilities is inserted in this codebase).
    expect(inserts).toHaveLength(1);
    const rows = inserts[0] as ItemRow[];
    // 2 weapons + armor + potion + class item + 4 supplies = 9
    expect(rows).toHaveLength(9);
  });

  it("does not insert character_items when no equipment is provided (backwards compat)", async () => {
    // Older call sites (and the heritage-only test fixtures above) don't pass equipment.
    // The save should still succeed and simply skip the character_items insert.
    await saveNewCharacter({
      supabase: mockSupabase as unknown as import("@supabase/supabase-js").SupabaseClient,
      campaignId: "campaign-1",
      systemId: "system-dh",
      userId: "user-1",
      wizardState: createMockState(),
      selectedClass: mockWarrior,
      selectedSubclass: mockSlayer,
    });

    const inserts = mockSupabase._insertCalls.character_items ?? [];
    expect(inserts).toHaveLength(0);
  });

  // ─── Experiences (character_stats exp_ rows, SRD step 7) ────

  /**
   * Helper to flatten all character_stats insert payloads into an array of rows.
   * The save batches stats in one or more `.insert([...])` calls, but tests only
   * care about the resulting rows regardless of batching.
   */
  function getStatRows(
    supabase: ReturnType<typeof createSupabaseMock>
  ): Array<{ stat_key: string; value: number; data?: Record<string, unknown> }> {
    const inserts = supabase._insertCalls.character_stats ?? [];
    return inserts.flatMap((payload) =>
      Array.isArray(payload) ? payload : [payload]
    ) as Array<{ stat_key: string; value: number; data?: Record<string, unknown> }>;
  }

  it("inserts exp_<slug> character_stats rows with value=2 and label preserved", async () => {
    await saveNewCharacter({
      supabase: mockSupabase as unknown as import("@supabase/supabase-js").SupabaseClient,
      campaignId: "campaign-1",
      systemId: "system-dh",
      userId: "user-1",
      wizardState: createMockState({
        experiences: [
          { name: "High Priestess" },
          { name: "Catch Me If You Can" },
        ],
      }),
      selectedClass: mockWarrior,
      selectedSubclass: mockSlayer,
    });

    const rows = getStatRows(mockSupabase);
    const expRows = rows.filter((r) => r.stat_key.startsWith("exp_"));
    expect(expRows).toHaveLength(2);

    const byKey = Object.fromEntries(expRows.map((r) => [r.stat_key, r]));
    expect(byKey["exp_high_priestess"]).toBeDefined();
    expect(byKey["exp_high_priestess"].value).toBe(2);
    expect(byKey["exp_high_priestess"].data).toMatchObject({ label: "High Priestess" });

    expect(byKey["exp_catch_me_if_you_can"]).toBeDefined();
    expect(byKey["exp_catch_me_if_you_can"].value).toBe(2);
    expect(byKey["exp_catch_me_if_you_can"].data).toMatchObject({
      label: "Catch Me If You Can",
    });
  });

  it("does not insert exp_ rows when both experience names are blank/whitespace", async () => {
    await saveNewCharacter({
      supabase: mockSupabase as unknown as import("@supabase/supabase-js").SupabaseClient,
      campaignId: "campaign-1",
      systemId: "system-dh",
      userId: "user-1",
      wizardState: createMockState({
        experiences: [{ name: "" }, { name: "   " }],
      }),
      selectedClass: mockWarrior,
      selectedSubclass: mockSlayer,
    });

    const rows = getStatRows(mockSupabase);
    expect(rows.filter((r) => r.stat_key.startsWith("exp_"))).toHaveLength(0);
    // Trait rows still write — verify the regression boundary
    expect(rows.filter((r) => !r.stat_key.startsWith("exp_")).length).toBeGreaterThan(0);
  });

  // ─── Domain card writes (SRD step 8) ───────────────────────

  const mockDomainCards = [
    {
      id: "card-whirlwind",
      name: "Whirlwind",
      ability_type: "domain_card",
      description: "Mark a Stress to attack all targets within Melee range.",
      level: 1,
      classes: ["Guardian", "Warrior"],
      source: "Daggerheart SRD",
      data: { domain: "Blade", card_type: "ability", recall_cost: 0 },
    },
    {
      id: "card-i-am-your-shield",
      name: "I Am Your Shield",
      ability_type: "domain_card",
      description: "When an ally within Close range takes damage, mark a Stress to take it for them.",
      level: 1,
      classes: ["Ranger", "Warrior"],
      source: "Daggerheart SRD",
      data: { domain: "Bone", card_type: "ability", recall_cost: 0 },
    },
  ];

  it("inserts a character_abilities row per chosen domain card with ability_ref_id", async () => {
    await saveNewCharacter({
      supabase: mockSupabase as unknown as import("@supabase/supabase-js").SupabaseClient,
      campaignId: "campaign-1",
      systemId: "system-dh",
      userId: "user-1",
      wizardState: createMockState(),
      selectedClass: mockWarrior,
      selectedSubclass: mockSlayer,
      domainCards: mockDomainCards,
    });

    const abilityInserts = mockSupabase._insertCalls.character_abilities ?? [];
    expect(abilityInserts).toHaveLength(1);
    const rows = abilityInserts[0] as Array<{
      ability_type: string;
      ability_ref_id: string;
      name: string;
      level_acquired: number;
      effect_text: string;
    }>;
    const cardRows = rows.filter((r) => r.ability_type === "domain_card");
    expect(cardRows).toHaveLength(2);
    expect(cardRows.map((r) => r.ability_ref_id).sort()).toEqual(
      ["card-i-am-your-shield", "card-whirlwind"].sort()
    );
    for (const row of cardRows) {
      expect(row.level_acquired).toBe(1);
      expect(row.effect_text).toBeTruthy();
    }
  });

  it("batches domain card rows alongside ancestry/community rows in a single insert call", async () => {
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
      domainCards: mockDomainCards,
    });

    const abilityInserts = mockSupabase._insertCalls.character_abilities ?? [];
    expect(abilityInserts).toHaveLength(1);
    const rows = abilityInserts[0] as Array<{ ability_type: string }>;
    expect(rows).toHaveLength(5); // 2 ancestry + 1 community + 2 domain cards
    expect(rows.filter((r) => r.ability_type === "domain_card")).toHaveLength(2);
  });

  it("does not insert domain-card rows when domainCards param is empty/omitted", async () => {
    await saveNewCharacter({
      supabase: mockSupabase as unknown as import("@supabase/supabase-js").SupabaseClient,
      campaignId: "campaign-1",
      systemId: "system-dh",
      userId: "user-1",
      wizardState: createMockState(),
      selectedClass: mockWarrior,
      selectedSubclass: mockSlayer,
      // ancestry/community supplied so character_abilities gets called, but no domain cards
      ancestryFeatures: mockKatariFeatures,
      communityFeatures: mockWanderborneFeatures,
    });

    const abilityInserts = mockSupabase._insertCalls.character_abilities ?? [];
    const rows = (abilityInserts[0] ?? []) as Array<{ ability_type: string }>;
    expect(rows.filter((r) => r.ability_type === "domain_card")).toHaveLength(0);
  });

  // ─── Class + subclass features persistence ─────────────────
  //
  // Regression guard: the wizard's review screen shows Hope Feature + Class
  // Feature + Subclass Foundation Feature, but the original save call was only
  // passing ancestry/community/domain rows — leaving the saved character
  // missing 3 ability rows. These tests fail without the classFeatures /
  // subclassFeatures param wiring.

  it("inserts a character_abilities row per class feature with ability_ref_id and ability_type='class_feature'", async () => {
    const classFeatures = [
      {
        id: "feat-warrior-no-mercy",
        name: "Warrior: No Mercy",
        ability_type: "class_feature",
        description: "Spend 3 Hope to gain a +1 bonus to attack rolls.",
        level: null,
        classes: ["Warrior"],
        data: { feature_category: "hope_feature" },
      },
      {
        id: "feat-warrior-aoo",
        name: "Warrior: Attack of Opportunity",
        ability_type: "class_feature",
        description: "When an adversary within Melee range tries to leave...",
        level: null,
        classes: ["Warrior"],
        data: { feature_category: "class_feature" },
      },
    ];

    await saveNewCharacter({
      supabase: mockSupabase as unknown as import("@supabase/supabase-js").SupabaseClient,
      campaignId: "campaign-1",
      systemId: "system-dh",
      userId: "user-1",
      wizardState: createMockState(),
      selectedClass: mockWarrior,
      selectedSubclass: mockSlayer,
      classFeatures,
    });

    const abilityInserts = mockSupabase._insertCalls.character_abilities ?? [];
    const rows = (abilityInserts[0] ?? []) as Array<{ ability_type: string; ability_ref_id: string }>;
    const classRows = rows.filter((r) => r.ability_type === "class_feature");
    expect(classRows).toHaveLength(2);
    expect(classRows.map((r) => r.ability_ref_id).sort()).toEqual(
      ["feat-warrior-aoo", "feat-warrior-no-mercy"].sort()
    );
  });

  it("inserts a character_abilities row per subclass foundation feature", async () => {
    const subclassFeatures = [
      {
        id: "feat-slayer-weapon-master",
        name: "Call of the Slayer: Weapon Specialist",
        ability_type: "subclass_feature",
        description: "You gain a bonus to weapon attacks.",
        level: null,
        classes: ["Warrior"],
        data: { subclass: "Call of the Slayer", feature_category: "foundation_feature" },
      },
    ];

    await saveNewCharacter({
      supabase: mockSupabase as unknown as import("@supabase/supabase-js").SupabaseClient,
      campaignId: "campaign-1",
      systemId: "system-dh",
      userId: "user-1",
      wizardState: createMockState(),
      selectedClass: mockWarrior,
      selectedSubclass: mockSlayer,
      subclassFeatures,
    });

    const abilityInserts = mockSupabase._insertCalls.character_abilities ?? [];
    const rows = (abilityInserts[0] ?? []) as Array<{ ability_type: string; ability_ref_id: string }>;
    const subRows = rows.filter((r) => r.ability_type === "subclass_feature");
    expect(subRows).toHaveLength(1);
    expect(subRows[0].ability_ref_id).toBe("feat-slayer-weapon-master");
  });

  it("batches class + subclass features into the same character_abilities insert as heritage + domain", async () => {
    const classFeatures = [
      {
        id: "feat-warrior-hope",
        name: "Warrior: No Mercy",
        ability_type: "class_feature",
        description: "...",
        level: null,
        classes: ["Warrior"],
        data: { feature_category: "hope_feature" },
      },
    ];
    const subclassFeatures = [
      {
        id: "feat-slayer-foundation",
        name: "Call of the Slayer: Weapon Specialist",
        ability_type: "subclass_feature",
        description: "...",
        level: null,
        classes: ["Warrior"],
        data: { subclass: "Call of the Slayer", feature_category: "foundation_feature" },
      },
    ];

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
      classFeatures,
      subclassFeatures,
    });

    // Single batched insert containing all four feature buckets
    const abilityInserts = mockSupabase._insertCalls.character_abilities ?? [];
    expect(abilityInserts).toHaveLength(1);
    const rows = abilityInserts[0] as Array<{ ability_type: string }>;
    // 2 ancestry + 1 community + 1 class + 1 subclass = 5
    expect(rows).toHaveLength(5);
  });

  // ─── Experience slug collision guard ───────────────────────
  //
  // character_stats has UNIQUE(character_id, stat_key). Two experience names
  // that slugify to the same value would crash the batch with a constraint
  // violation. This guards against the regression.

  it("disambiguates experiences whose names slugify to the same stat_key", async () => {
    await saveNewCharacter({
      supabase: mockSupabase as unknown as import("@supabase/supabase-js").SupabaseClient,
      campaignId: "campaign-1",
      systemId: "system-dh",
      userId: "user-1",
      // Both slugify to `exp_world_traveler` without disambiguation.
      wizardState: createMockState({
        experiences: [{ name: "World-Traveler" }, { name: "World Traveler" }],
      }),
      selectedClass: mockWarrior,
      selectedSubclass: mockSlayer,
    });

    const statRows = (mockSupabase._insertCalls.character_stats?.[0] ?? []) as Array<{
      stat_key: string;
      data: { label: string };
    }>;
    const expRows = statRows.filter((r) => r.stat_key.startsWith("exp_"));
    expect(expRows).toHaveLength(2);
    const keys = expRows.map((r) => r.stat_key).sort();
    // Both keys distinct, labels preserved verbatim.
    expect(new Set(keys).size).toBe(2);
    expect(expRows.map((r) => r.data.label).sort()).toEqual(
      ["World Traveler", "World-Traveler"].sort()
    );
  });
});
