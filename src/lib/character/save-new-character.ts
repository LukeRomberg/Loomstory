import type { SupabaseClient } from "@supabase/supabase-js";
import type { WizardState, CompendiumClass } from "./wizard-types";

interface SaveParams {
  supabase: SupabaseClient;
  campaignId: string;
  systemId: string;
  userId: string;
  wizardState: WizardState;
  selectedClass: CompendiumClass | null;
  selectedSubclass: CompendiumClass | null;
}

interface SaveResult {
  characterId: string;
}

/**
 * Batch-saves a new character and all child rows from the wizard state.
 * Creates: character, character_classes, character_stats, character_resources.
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
        ancestry: wizardState.textFields.ancestry ?? null,
        community: wizardState.textFields.community ?? null,
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

    return { characterId };
  } catch (err) {
    // Rollback: delete the character (cascades to children)
    await supabase.from("characters").delete().eq("id", characterId);
    throw err;
  }
}
