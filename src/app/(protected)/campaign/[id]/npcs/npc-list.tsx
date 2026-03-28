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
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/loomstory/empty-state";
import { EntityQuickView } from "@/components/loomstory/entity-quick-view";
import { ChevronLeft, Plus, Users, EyeOff } from "lucide-react";

interface Npc {
  id: string;
  name: string;
  aliases: string[] | null;
  description: string | null;
  status: string;
  tags: string[] | null;
  gm_only: boolean;
  portrait_url: string | null;
}

interface NpcListProps {
  campaignId: string;
  campaignName: string;
  npcs: Npc[];
  role: string;
  userId: string;
}

export function NpcList({ campaignId, campaignName, npcs: initialNpcs, role, userId }: NpcListProps) {
  const router = useRouter();
  const isGm = role === "gm";
  const [npcs, setNpcs] = useState(initialNpcs);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [quickViewNpc, setQuickViewNpc] = useState<Npc | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("npcs")
      .insert({ campaign_id: campaignId, name, created_by: userId, updated_by: userId, gm_only: true })
      .select()
      .single();

    if (error || !data) {
      toast.error("Failed to create NPC", { description: error?.message });
      setCreating(false);
      return;
    }

    setOpen(false);
    setName("");
    setCreating(false);
    router.push(`/campaign/${campaignId}/npcs/${data.id}`);
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <button
            onClick={() => router.push(`/campaign/${campaignId}`)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
          >
            <ChevronLeft className="size-4" />
            {campaignName}
          </button>
          <h2 className="text-2xl font-heading font-semibold">NPCs</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {npcs.length} npc{npcs.length !== 1 ? "s" : ""} in this campaign
          </p>
        </div>
        {isGm && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <Button className="gold-glow font-heading">
                  <Plus className="size-4 mr-1.5" />
                  New NPC
                </Button>
              }
            />
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle className="font-heading">New NPC</DialogTitle>
                  <DialogDescription>Create an NPC and fill in details on the next page.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="npc-name">Name</Label>
                    <Input id="npc-name" placeholder="Gareth the Bold" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={creating || !name.trim()} className="gold-glow">{creating ? "Creating..." : "Create NPC"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {npcs.length === 0 ? (
        <EmptyState icon={Users} message="No NPCs yet. Process a session or create one manually." action={isGm ? { label: "New NPC", onClick: () => setOpen(true) } : undefined} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {npcs.map((npc) => (
            <Card key={npc.id} className="grain gold-glow cursor-pointer" onClick={() => setQuickViewNpc(npc)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="font-heading">{npc.name}</CardTitle>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {npc.gm_only && (
                      <Badge variant="secondary" className="text-xs"><EyeOff className="size-3 mr-1" />GM Only</Badge>
                    )}
                    <Badge variant="outline" className="text-xs">{npc.status}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {npc.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{npc.description}</p>
                )}
                {npc.tags && npc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {npc.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {quickViewNpc && (
        <EntityQuickView
          entity={quickViewNpc}
          entityType="npc"
          campaignId={campaignId}
          role={role}
          open={!!quickViewNpc}
          onClose={() => setQuickViewNpc(null)}
        />
      )}
    </div>
  );
}
