"use client";

import { useState } from "react";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmptyState } from "@/components/loomstory/empty-state";
import { ChevronLeft, Plus, Shield, EyeOff } from "lucide-react";

interface Faction {
  id: string;
  name: string;
  description: string | null;
  goals: string | null;
  gm_only: boolean;
}

interface FactionListProps {
  campaignId: string;
  campaignName: string;
  factions: Faction[];
  role: string;
  userId: string;
}

export function FactionList({ campaignId, campaignName, factions: initial, role, userId }: FactionListProps) {
  const router = useTransitionRouter();
  const isGm = role === "gm";
  const [factions] = useState(initial);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("factions")
      .insert({ campaign_id: campaignId, name, created_by: userId, updated_by: userId, gm_only: true })
      .select().single();
    if (error || !data) { toast.error("Failed to create faction", { description: error?.message }); setCreating(false); return; }
    setOpen(false); setName(""); setCreating(false);
    router.push(`/campaign/${campaignId}/factions/${data.id}`);
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => router.push(`/campaign/${campaignId}`)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors">
            <ChevronLeft className="size-4" />{campaignName}
          </button>
          <h2 className="text-2xl font-heading font-semibold">Factions</h2>
          <p className="text-sm text-muted-foreground mt-1">{factions.length} faction{factions.length !== 1 ? "s" : ""} in this campaign</p>
        </div>
        {isGm && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button className="gold-glow font-heading"><Plus className="size-4 mr-1.5" />New Faction</Button>} />
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader><DialogTitle className="font-heading">New Faction</DialogTitle><DialogDescription>Create a faction and fill in details on the next page.</DialogDescription></DialogHeader>
                <div className="space-y-4 py-4"><div className="space-y-2"><Label htmlFor="fac-name">Name</Label><Input id="fac-name" placeholder="The Crimson Hand" value={name} onChange={(e) => setName(e.target.value)} required /></div></div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={creating || !name.trim()} className="gold-glow">{creating ? "Creating..." : "Create Faction"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {factions.length === 0 ? (
        <EmptyState icon={Shield} message="No factions yet. Process a session or create one manually." action={isGm ? { label: "New Faction", onClick: () => setOpen(true) } : undefined} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {factions.map((fac) => (
            <Card key={fac.id} className="grain gold-glow cursor-pointer" onClick={() => router.push(`/campaign/${campaignId}/factions/${fac.id}`)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="font-heading">{fac.name}</CardTitle>
                  {fac.gm_only && <Badge variant="secondary" className="text-xs shrink-0 ml-2"><EyeOff className="size-3 mr-1" />GM Only</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                {fac.description && <p className="text-sm text-muted-foreground line-clamp-2">{fac.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
