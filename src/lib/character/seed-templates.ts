/**
 * Seed system_templates with character sheet JSON from template files.
 *
 * Run this after migrations to populate the template sections JSONB.
 * Usage: npx tsx app/src/lib/character/seed-templates.ts
 */

import { createClient } from "@supabase/supabase-js";
import dnd5eTemplate from "../../data/templates/dnd5e-template.json";
import pf2eTemplate from "../../data/templates/pf2e-template.json";
import daggerheartTemplate from "../../data/templates/daggerheart-template.json";
import dungeonWorldTemplate from "../../data/templates/dungeon-world-template.json";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const templates: Record<string, unknown[]> = {
  dnd5e: dnd5eTemplate,
  pf2e: pf2eTemplate,
  daggerheart: daggerheartTemplate,
  dungeon_world: dungeonWorldTemplate,
};

async function seedTemplates() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data: systems, error: sysErr } = await supabase
    .from("systems")
    .select("id, slug");

  if (sysErr || !systems) {
    console.error("Failed to fetch systems:", sysErr);
    process.exit(1);
  }

  for (const [slug, sections] of Object.entries(templates)) {
    const system = systems.find((s) => s.slug === slug);
    if (!system) {
      console.warn(`System '${slug}' not found, skipping`);
      continue;
    }

    const { error } = await supabase
      .from("system_templates")
      .upsert(
        { system_id: system.id, sections, version: 1 },
        { onConflict: "system_id" }
      );

    if (error) {
      console.error(`Failed to seed ${slug}:`, error);
    } else {
      console.log(`Seeded ${slug} template (${(sections as unknown[]).length} sections)`);
    }
  }
}

seedTemplates();
