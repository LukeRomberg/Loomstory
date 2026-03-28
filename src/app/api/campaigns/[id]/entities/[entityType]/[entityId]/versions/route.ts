import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; entityType: string; entityId: string }> }
) {
  const { id, entityType, entityId } = await params;

  const { data: versions, error } = await supabase
    .from("entity_versions")
    .select("id, entity_type, entity_id, version_number, snapshot, change_summary, changed_by, changed_at")
    .eq("campaign_id", id)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("version_number", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Resolve changed_by user names
  const userIds = [...new Set((versions ?? []).map((v) => v.changed_by))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", userIds);

  const nameMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.display_name])
  );

  const enriched = (versions ?? []).map((v) => ({
    ...v,
    changed_by_name: nameMap.get(v.changed_by) ?? "Unknown",
  }));

  return NextResponse.json(enriched);
}
