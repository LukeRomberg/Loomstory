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
import { EntityQuickView } from "@/components/loomstory/entity-quick-view";
import { ChevronLeft, Plus, Sword, EyeOff } from "lucide-react";

interface Item {
  id: string;
  name: string;
  description: string | null;
  type: string | null;
  mechanical_properties: Record<string, unknown> | null;
  gm_notes: string | null;
  player_notes: string | null;
  gm_only: boolean;
}

interface ItemListProps {
  campaignId: string;
  campaignName: string;
  items: Item[];
  role: string;
  userId: string;
}

export function ItemList({ campaignId, campaignName, items: initial, role, userId }: ItemListProps) {
  const router = useRouter();
  const isGm = role === "gm";
  const [items] = useState(initial);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [quickViewItem, setQuickViewItem] = useState<Item | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("items")
      .insert({ campaign_id: campaignId, name, created_by: userId, updated_by: userId, gm_only: true })
      .select().single();
    if (error || !data) { toast.error("Failed to create item", { description: error?.message }); setCreating(false); return; }
    setOpen(false); setName(""); setCreating(false);
    toast.success("Item created");
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => router.push(`/campaign/${campaignId}`)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors">
            <ChevronLeft className="size-4" />{campaignName}
          </button>
          <h2 className="text-2xl font-heading font-semibold">Items</h2>
          <p className="text-sm text-muted-foreground mt-1">{items.length} item{items.length !== 1 ? "s" : ""} in this campaign</p>
        </div>
        {isGm && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button className="gold-glow font-heading"><Plus className="size-4 mr-1.5" />New Item</Button>} />
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader><DialogTitle className="font-heading">New Item</DialogTitle><DialogDescription>Create an item and fill in details later.</DialogDescription></DialogHeader>
                <div className="space-y-4 py-4"><div className="space-y-2"><Label htmlFor="item-name">Name</Label><Input id="item-name" placeholder="Flame Tongue Longsword" value={name} onChange={(e) => setName(e.target.value)} required /></div></div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={creating || !name.trim()} className="gold-glow">{creating ? "Creating..." : "Create Item"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Sword} message="No items yet. Process a session or create one manually." action={isGm ? { label: "New Item", onClick: () => setOpen(true) } : undefined} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="grain gold-glow cursor-pointer" onClick={() => setQuickViewItem(item)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="font-heading">{item.name}</CardTitle>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {item.gm_only && <Badge variant="secondary" className="text-xs"><EyeOff className="size-3 mr-1" />GM Only</Badge>}
                    {item.type && <Badge variant="outline" className="text-xs">{item.type}</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {item.description && <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {quickViewItem && (
        <EntityQuickView
          entity={quickViewItem}
          entityType="item"
          campaignId={campaignId}
          role={role}
          open={!!quickViewItem}
          onClose={() => setQuickViewItem(null)}
        />
      )}
    </div>
  );
}
