import type { SupabaseClient } from "@supabase/supabase-js";
import type { WizardState, CompendiumClass, CompendiumAbility } from "./wizard-types";

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

    // 3. Insert character_stats (6 trait rows)
    const statRows = Object.entries(wizardState.statValues).map(([statKey, value]) => ({
      character_id: characterId,
      stat_key: statKey,
      value,
      data: { marked: wizardState.markedKeys.includes(statKey) },
    }));

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

    // 5. Insert character_abilities for ancestry + community features (one row per feature)
    const abilityRows = [
      ...ancestryFeatures.map((f) => compendiumAbilityToCharacterRow(characterId, f)),
      ...communityFeatures.map((f) => compendiumAbilityToCharacterRow(characterId, f)),
    ];
    if (abilityRows.length > 0) {
      const { error: abilitiesError } = await supabase
        .from("character_abilities")
        .insert(abilityRows);
      if (abilitiesError) throw abilitiesError;
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
