import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ENTITY_TABLES: Record<string, string> = {
  npc: "npcs",
  location: "locations",
  faction: "factions",
  item: "items",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; entityType: string; entityId: string }> }
) {
  const { id, entityType, entityId } = await params;

  // Fetch relations where this entity is source or target
  const { data: relations, error } = await supabase
    .from("entity_relations")
    .select("id, source_type, source_id, target_type, target_id, relation_type, description")
    .eq("campaign_id", id)
    .is("deleted_at", null)
    .or(`source_id.eq.${entityId},target_id.eq.${entityId}`);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Resolve entity names for display
  const entityIds = new Set<string>();
  for (const rel of relations ?? []) {
    entityIds.add(rel.source_id);
    entityIds.add(rel.target_id);
  }

  const nameMap = new Map<string, string>();

  for (const table of Object.values(ENTITY_TABLES)) {
    const { data } = await supabase
      .from(table)
      .select("id, name")
      .eq("campaign_id", id)
      .in("id", Array.from(entityIds));

    for (const row of data ?? []) {
      nameMap.set(row.id, row.name);
    }
  }

  const enrichedRelations = (relations ?? []).map((rel) => ({
    ...rel,
    source_name: nameMap.get(rel.source_id) ?? "Unknown",
    target_name: nameMap.get(rel.target_id) ?? "Unknown",
  }));

  // Fetch relation types
  const { data: relationTypes } = await supabase
    .from("relation_types")
    .select("id, label")
    .order("sort_order");

  // Fetch all known entities for the "add relation" dropdown
  const knownEntities: { id: string; name: string; entity_type: string }[] = [];
  for (const [type, table] of Object.entries(ENTITY_TABLES)) {
    const { data } = await supabase
      .from(table)
      .select("id, name")
      .eq("campaign_id", id)
      .is("deleted_at", null);
    for (const row of data ?? []) {
      knownEntities.push({ id: row.id, name: row.name, entity_type: type });
    }
  }

  return NextResponse.json({
    relations: enrichedRelations,
    relationTypes: relationTypes ?? [],
    knownEntities,
  });
}
