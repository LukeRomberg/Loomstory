import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [npcs, locations, factions, items] = await Promise.all([
    supabase
      .from("npcs")
      .select("id, name")
      .eq("campaign_id", id)
      .is("deleted_at", null)
      .order("name"),
    supabase
      .from("locations")
      .select("id, name")
      .eq("campaign_id", id)
      .is("deleted_at", null)
      .order("name"),
    supabase
      .from("factions")
      .select("id, name")
      .eq("campaign_id", id)
      .is("deleted_at", null)
      .order("name"),
    supabase
      .from("items")
      .select("id, name")
      .eq("campaign_id", id)
      .is("deleted_at", null)
      .order("name"),
  ]);

  return NextResponse.json({
    npcs: npcs.data ?? [],
    locations: locations.data ?? [],
    factions: factions.data ?? [],
    items: items.data ?? [],
  });
}
