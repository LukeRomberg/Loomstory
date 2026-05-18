"use client";

import { useState, useMemo } from "react";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OpenBookView } from "@/components/shared/open-book-view";
import { cn } from "@/lib/utils";
import { EyeOff } from "lucide-react";

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

export function ItemList({
  campaignId,
  campaignName: _campaignName,
  items: initial,
  role,
  userId,
}: ItemListProps) {
  const router = useTransitionRouter();
  const isGm = role === "gm";
  const [items] = useState(initial);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initial[0]?.id ?? null);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.type?.toLowerCase().includes(q)
    );
  }, [items, search]);

  const selected = filtered.find((i) => i.id === selectedId) ?? filtered[0] ?? null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("items")
      .insert({ campaign_id: campaignId, name, created_by: userId, updated_by: userId, gm_only: true })
      .select()
      .single();
    if (error || !data) {
      toast.error("Failed to create item", { description: error?.message });
      setCreating(false);
      return;
    }
    setCreateOpen(false);
    setName("");
    setCreating(false);
    toast.success("Item created");
    router.refresh();
  }

  const leftPage = (
    <>
      <div className="flex shrink-0 items-center gap-2">
        <h2 className="mr-auto font-heading text-base uppercase tracking-[0.15em] text-leather sm:text-lg">
          Items{" "}
          <span className="ml-1 font-sans text-xs font-normal text-leather/65 sm:text-sm">
            ({items.length})
          </span>
        </h2>
        <Input
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-40 border-leather/30 bg-parchment/30 text-xs text-leather placeholder:text-leather/40"
        />
      </div>

      <div className="scrollbar-none flex-1 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-xs italic text-leather/60">
            {items.length === 0 ? "No items yet." : "No matches."}
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((i) => (
              <button
                key={i.id}
                onClick={() => setSelectedId(i.id)}
                className={cn(
                  "w-full rounded border border-leather/15 px-3 py-2 text-left transition",
                  "hover:bg-leather/5",
                  selected?.id === i.id && "border-leather/40 bg-leather/10"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="line-clamp-1 font-heading text-sm text-leather">{i.name}</div>
                  {i.gm_only && <EyeOff className="size-3.5 shrink-0 text-leather/70" />}
                </div>
                {i.type && (
                  <div className="mt-0.5 line-clamp-1 text-xs font-semibold uppercase tracking-[0.08em] text-leather/70">
                    {i.type}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );

  const rightPage = selected ? (
    <ItemDetail item={selected} isGm={isGm} />
  ) : (
    <div className="flex h-full items-center justify-center text-xs italic text-leather/60">
      Select an item to view.
    </div>
  );

  return (
    <OpenBookView
      leftPage={leftPage}
      rightPage={rightPage}
      onBack={() => router.push(`/campaign/${campaignId}`)}
      onNew={isGm ? () => setCreateOpen(true) : undefined}
      newAriaLabel="New item"
    >
      {isGm && (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle className="font-heading">New Item</DialogTitle>
                <DialogDescription>Create an item and fill in details later.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="item-name">Name</Label>
                  <Input
                    id="item-name"
                    placeholder="Sunsteel Blade"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating || !name.trim()} className="gold-glow">
                  {creating ? "Creating..." : "Create Item"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </OpenBookView>
  );
}

function ItemDetail({ item, isGm }: { item: Item; isGm: boolean }) {
  return (
    <div className="scrollbar-none flex h-full flex-col gap-3 overflow-y-auto pr-1">
      <div>
        <h3 className="font-heading text-base uppercase tracking-[0.12em] text-leather sm:text-lg">
          {item.name}
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {item.type && (
            <Badge variant="outline" className="border-leather/40 text-[11px] font-semibold uppercase text-leather">
              {item.type}
            </Badge>
          )}
          {item.gm_only && (
            <Badge variant="secondary" className="text-[11px] font-semibold">
              <EyeOff className="mr-1 size-3" />
              GM Only
            </Badge>
          )}
        </div>
      </div>

      {item.description ? (
        <p className="whitespace-pre-line text-sm text-leather sm:text-base">{item.description}</p>
      ) : (
        <p className="text-xs italic text-leather/60">No description yet.</p>
      )}

      {item.player_notes && (
        <div>
          <div className="mb-1 font-heading text-xs uppercase tracking-[0.1em] text-leather/65">Notes</div>
          <p className="whitespace-pre-line text-sm italic text-leather">{item.player_notes}</p>
        </div>
      )}

      {isGm && item.gm_notes && (
        <div className="border-t border-leather/30 pt-2">
          <div className="mb-1 font-heading text-xs uppercase tracking-[0.12em] text-leather/70">GM Notes</div>
          <p className="whitespace-pre-line text-sm italic text-leather">{item.gm_notes}</p>
        </div>
      )}
    </div>
  );
}
