import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  WizardState,
  CompendiumClass,
  CompendiumAbility,
  CompendiumItem,
} from "./wizard-types";

interface SaveParams {
  supabase: SupabaseClient;
  campaignId: string;
  systemId: string;
  userId: string;
  wizardState: WizardState;
  selectedClass: CompendiumClass | null;
  selectedSubclass: CompendiumClass | null;
  /** Ancestry features (both rows for the chosen ancestry, e.g. Faerie's Luckbender + Wings). */
  ancestryFeatures?: CompendiumAbility[];
  /** Community feature row(s) for the chosen community (usually 1). */
  communityFeatures?: CompendiumAbility[];
  /** Level-1 domain cards picked at the Cards step (SRD step 8). Each writes one character_abilities row. */
  domainCards?: CompendiumAbility[];
  /** Tier 1 primary weapon picked in the wizard. */
  primaryWeapon?: CompendiumItem | null;
  /** Tier 1 secondary weapon. null when the primary is Two-Handed. */
  secondaryWeapon?: CompendiumItem | null;
  /** Tier 1 armor picked in the wizard. */
  armor?: CompendiumItem | null;
  /** Starting potion: Minor Health or Minor Stamina. */
  potion?: CompendiumItem | null;
  /** Free-text class-specific item name (one of two SRD options for the class). */
  classItemName?: string | null;
  /**
   * Map of basic-supply name → compendium_items id, resolved by the caller from
   * the seeded supply rows. Used to set compendium_item_ref_id on each starting
   * supply row. Empty/omitted ⇒ supplies are not inserted (backwards compat).
   */
  basicSupplyIds?: Record<string, string>;
}

interface SaveResult {
  characterId: string;
}

/**
 * Batch-saves a new character and all child rows from the wizard state.
 * Creates: character, character_classes, character_stats, character_resources,
 * and one character_abilities row per ancestry/community feature (linked via ability_ref_id).
 * On failure after character creation, deletes the character row (cascades children).
 */
export async function saveNewCharacter({
  supabase,
  campaignId,
  systemId,
  userId,
  wizardState,
  selectedClass,
  selectedSubclass,
  ancestryFeatures = [],
  communityFeatures = [],
  domainCards = [],
  primaryWeapon = null,
  secondaryWeapon = null,
  armor = null,
  potion = null,
  classItemName = null,
  basicSupplyIds = {},
}: SaveParams): Promise<SaveResult> {
  const classData = (selectedClass?.data ?? {}) as Record<string, unknown>;
  const hpSlots = (classData.hp_slots as number) ?? 6;
  const evasion = (classData.evasion as number) ?? 10;

  // 1. Insert character
  const { data: character, error: charError } = await supabase
    .from("characters")
    .insert({
      campaign_id: campaignId,
      system_id: systemId,
      user_id: userId,
      name: wizardState.name,
      level: 1,
      hp_current: hpSlots,
      hp_max: hpSlots,
      data: {
        ancestry: wizardState.ancestryName,
        community: wizardState.communityName,
        evasion,
      },
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single();

  if (charError || !character) {
    throw new Error(charError?.message ?? "Failed to create character");
  }

  const characterId = character.id;

  try {
    // 2. Insert character_classes
    if (selectedClass) {
      const { error: classError } = await supabase
        .from("character_classes")
        .insert({
          character_id: characterId,
          class_id: selectedClass.id,
          subclass_id: selectedSubclass?.id ?? null,
          level: 1,
          is_primary: true,
        });
      if (classError) throw classError;
    }

    // 3. Insert character_stats (6 trait rows + 2 exp_ rows for experiences)
    const traitRows = Object.entries(wizardState.statValues).map(([statKey, value]) => ({
      character_id: characterId,
      stat_key: statKey,
      value,
      data: {},
    }));

    const experienceRows = (wizardState.experiences ?? [])
      .map((e) => e.name.trim())
      .filter((name) => name.length > 0)
      .map((name) => ({
        character_id: characterId,
        stat_key: `exp_${slugifyExperience(name)}`,
        value: 2,
        data: { label: name },
      }));

    const statRows = [...traitRows, ...experienceRows];

    if (statRows.length > 0) {
      const { error: statsError } = await supabase
        .from("character_stats")
        .insert(statRows);
      if (statsError) throw statsError;
    }

    // 4. Insert character_resources (Hope + Stress defaults)
    const { error: resourceError } = await supabase
      .from("character_resources")
      .insert([
        {
          character_id: characterId,
          resource_key: "hope",
          label: "Hope",
          current_value: 2,
          max_value: 6,
          data: {},
        },
        {
          character_id: characterId,
          resource_key: "stress",
          label: "Stress",
          current_value: 0,
          max_value: 6,
          data: {},
        },
      ]);
    if (resourceError) throw resourceError;

    // 5. Insert character_abilities for ancestry + community features + domain cards
    // (one row per feature/card, all batched into a single insert call).
    const abilityRows = [
      ...ancestryFeatures.map((f) => compendiumAbilityToCharacterRow(characterId, f)),
      ...communityFeatures.map((f) => compendiumAbilityToCharacterRow(characterId, f)),
      ...domainCards.map((c) => compendiumAbilityToCharacterRow(characterId, c)),
    ];
    if (abilityRows.length > 0) {
      const { error: abilitiesError } = await supabase
        .from("character_abilities")
        .insert(abilityRows);
      if (abilitiesError) throw abilitiesError;
    }

    // 6. Insert character_items for equipment + auto-added basic supplies.
    // Batched into a single insert call so the round trip count stays at one.
    const itemRows = buildCharacterItemRows({
      characterId,
      primaryWeapon,
      secondaryWeapon,
      armor,
      potion,
      classItemName,
      basicSupplyIds,
    });
    if (itemRows.length > 0) {
      const { error: itemsError } = await supabase
        .from("character_items")
        .insert(itemRows);
      if (itemsError) throw itemsError;
    }

    return { characterId };
  } catch (err) {
    // Rollback: delete the character (cascades to children). If the cleanup itself fails,
    // log it — the original error still rethrows below, but the GM may be left with an
    // orphaned character row that needs manual cleanup.
    const { error: rollbackError } = await supabase
      .from("characters")
      .delete()
      .eq("id", characterId);
    if (rollbackError) {
      console.error("Failed to rollback character after save error:", rollbackError);
    }
    throw err;
  }
}

/**
 * Slugify an experience name into the suffix used after `exp_` in stat_key.
 * Lowercases, replaces every non-alphanumeric run with `_`, then trims leading
 * and trailing underscores. Matches the convention reserved in the design doc
 * for the Daggerheart `exp_` stat-key prefix.
 */
function slugifyExperience(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Build a character_abilities row from a compendium_abilities row, linking via ability_ref_id.
 * `data` is intentionally an empty object — the compendium row already carries the typed data
 * (e.g. `{ancestry: "Faerie", position: "top"}`) and can be looked up by following the ref id.
 */
function compendiumAbilityToCharacterRow(
  characterId: string,
  feature: CompendiumAbility
): Record<string, unknown> {
  return {
    character_id: characterId,
    ability_type: feature.ability_type,
    ability_ref_id: feature.id,
    name: feature.name,
    source: feature.source,
    level_acquired: 1,
    effect_text: feature.description,
    data: {},
  };
}

/**
 * Build the full set of character_items rows for a new character: chosen weapons,
 * armor, potion, the free-text class item, and the four SRD step-5 starting supplies.
 * Returns an empty array when no equipment params are supplied so older test paths
 * (and pre-equipment callers) don't accidentally insert anything.
 */
function buildCharacterItemRows({
  characterId,
  primaryWeapon,
  secondaryWeapon,
  armor,
  potion,
  classItemName,
  basicSupplyIds,
}: {
  characterId: string;
  primaryWeapon: CompendiumItem | null;
  secondaryWeapon: CompendiumItem | null;
  armor: CompendiumItem | null;
  potion: CompendiumItem | null;
  classItemName: string | null;
  basicSupplyIds: Record<string, string>;
}): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];

  if (primaryWeapon) {
    rows.push(compendiumItemRow(characterId, primaryWeapon, { equipped: true }));
  }
  if (secondaryWeapon) {
    rows.push(compendiumItemRow(characterId, secondaryWeapon, { equipped: true }));
  }
  if (armor) {
    rows.push(compendiumItemRow(characterId, armor, { equipped: true }));
  }
  if (potion) {
    rows.push(compendiumItemRow(characterId, potion, { equipped: false }));
  }
  if (classItemName) {
    // Free-text inventory row — no compendium ref since the SRD class-item options
    // are flavor strings, not seeded compendium_items rows.
    rows.push({
      character_id: characterId,
      name: classItemName,
      item_type: "equipment",
      quantity: 1,
      equipped: false,
      compendium_item_ref_id: null,
      data: {},
    });
  }

  // Auto-added starting supplies. Each is a compendium-backed row linked by the
  // id the caller resolved upstream (see the wizard's basicSupplyIds lookup).
  for (const [name, refId] of Object.entries(basicSupplyIds)) {
    rows.push({
      character_id: characterId,
      name,
      item_type: "equipment",
      quantity: 1,
      equipped: false,
      compendium_item_ref_id: refId,
      data: {},
    });
  }

  return rows;
}

/** Build one character_items row from a CompendiumItem. */
function compendiumItemRow(
  characterId: string,
  item: CompendiumItem,
  opts: { equipped: boolean }
): Record<string, unknown> {
  return {
    character_id: characterId,
    name: item.name,
    item_type: item.type,
    quantity: 1,
    equipped: opts.equipped,
    compendium_item_ref_id: item.id,
    data: {},
  };
}
