"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmptyState } from "@/components/loomstory/empty-state";
import { ChevronLeft, Plus, MapPin, EyeOff } from "lucide-react";

interface Location {
  id: string;
  name: string;
  aliases: string[] | null;
  description: string | null;
  type: string | null;
  gm_only: boolean;
}

interface LocationListProps {
  campaignId: string;
  campaignName: string;
  locations: Location[];
  role: string;
  userId: string;
}

export function LocationList({ campaignId, campaignName, locations: initial, role, userId }: LocationListProps) {
  const router = useRouter();
  const isGm = role === "gm";
  const [locations] = useState(initial);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("locations")
      .insert({ campaign_id: campaignId, name, created_by: userId, updated_by: userId, gm_only: true })
      .select().single();
    if (error || !data) { toast.error("Failed to create location", { description: error?.message }); setCreating(false); return; }
    setOpen(false); setName(""); setCreating(false);
    router.push(`/campaign/${campaignId}/locations/${data.id}`);
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => router.push(`/campaign/${campaignId}`)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors">
            <ChevronLeft className="size-4" />{campaignName}
          </button>
          <h2 className="text-2xl font-heading font-semibold">Locations</h2>
          <p className="text-sm text-muted-foreground mt-1">{locations.length} location{locations.length !== 1 ? "s" : ""} in this campaign</p>
        </div>
        {isGm && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button className="gold-glow font-heading"><Plus className="size-4 mr-1.5" />New Location</Button>} />
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader><DialogTitle className="font-heading">New Location</DialogTitle><DialogDescription>Create a location and fill in details on the next page.</DialogDescription></DialogHeader>
                <div className="space-y-4 py-4"><div className="space-y-2"><Label htmlFor="loc-name">Name</Label><Input id="loc-name" placeholder="Ironhold" value={name} onChange={(e) => setName(e.target.value)} required /></div></div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={creating || !name.trim()} className="gold-glow">{creating ? "Creating..." : "Create Location"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {locations.length === 0 ? (
        <EmptyState icon={MapPin} message="No locations yet. Process a session or create one manually." action={isGm ? { label: "New Location", onClick: () => setOpen(true) } : undefined} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((loc) => (
            <Card key={loc.id} className="grain gold-glow cursor-pointer" onClick={() => router.push(`/campaign/${campaignId}/locations/${loc.id}`)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="font-heading">{loc.name}</CardTitle>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {loc.gm_only && <Badge variant="secondary" className="text-xs"><EyeOff className="size-3 mr-1" />GM Only</Badge>}
                    {loc.type && <Badge variant="outline" className="text-xs">{loc.type}</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loc.description && <p className="text-sm text-muted-foreground line-clamp-2">{loc.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
