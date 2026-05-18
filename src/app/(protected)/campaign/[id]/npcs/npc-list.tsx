"use client";

import { useState, useMemo, useCallback } from "react";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { NpcDetail } from "./npc-detail";

interface Npc {
  id: string;
  name: string;
  aliases: string[] | null;
  description: string | null;
  status: string;
  tags: string[] | null;
  gm_only: boolean;
  portrait_url: string | null;
  gm_notes: string | null;
  player_notes: string | null;
  last_location_id: string | null;
}

interface NpcListProps {
  campaignId: string;
  campaignName: string;
  npcs: Npc[];
  role: string;
  userId: string;
}

export function NpcList({
  campaignId,
  campaignName: _campaignName,
  npcs: initialNpcs,
  role,
  userId,
}: NpcListProps) {
  const router = useTransitionRouter();
  const searchParams = useSearchParams();
  const isGm = role === "gm";
  const [npcs, setNpcs] = useState(initialNpcs);
  const [search, setSearch] = useState("");
  const urlSelected = searchParams.get("selected");
  const [selectedId, setSelectedId] = useState<string | null>(
    urlSelected ?? initialNpcs[0]?.id ?? null
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return npcs;
    const q = search.toLowerCase();
    return npcs.filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        n.aliases?.some((a) => a.toLowerCase().includes(q)) ||
        n.description?.toLowerCase().includes(q) ||
        n.tags?.some((t) => t.toLowerCase().includes(q)) ||
        n.status?.toLowerCase().includes(q)
    );
  }, [npcs, search]);

  const selected =
    npcs.find((n) => n.id === selectedId) ?? filtered[0] ?? null;

  const selectNpc = useCallback(
    (id: string) => {
      setSelectedId(id);
      router.replace(`/campaign/${campaignId}/npcs?selected=${id}`);
    },
    [campaignId, router]
  );

  const handleDeleted = useCallback(() => {
    if (!selected) return;
    const remaining = npcs.filter((n) => n.id !== selected.id);
    setNpcs(remaining);
    setSelectedId(remaining[0]?.id ?? null);
  }, [npcs, selected]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("npcs")
      .insert({
        campaign_id: campaignId,
        name,
        created_by: userId,
        updated_by: userId,
        gm_only: true,
      })
      .select()
      .single();

    if (error || !data) {
      toast.error("Failed to create NPC", { description: error?.message });
      setCreating(false);
      return;
    }

    const created: Npc = {
      id: data.id,
      name: data.name,
      aliases: null,
      description: null,
      status: "alive",
      tags: null,
      gm_only: true,
      portrait_url: null,
      gm_notes: null,
      player_notes: null,
      last_location_id: null,
      ...data,
    };
    setNpcs((prev) => [...prev, created]);
    selectNpc(created.id);
    setCreateOpen(false);
    setName("");
    setCreating(false);
    toast.success("NPC created");
  }

  const leftPage = (
    <>
      <div className="flex shrink-0 items-center gap-2">
        <h2 className="mr-auto font-heading text-base uppercase tracking-[0.15em] text-leather sm:text-lg">
          NPCs{" "}
          <span className="ml-1 font-sans text-xs font-normal text-leather/65 sm:text-sm">
            ({npcs.length})
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
            {npcs.length === 0 ? "No NPCs yet." : "No matches."}
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((npc) => (
              <button
                key={npc.id}
                onClick={() => selectNpc(npc.id)}
                className={cn(
                  "w-full rounded border border-leather/15 px-3 py-2 text-left transition",
                  "hover:bg-leather/5",
                  selected?.id === npc.id &&
                    "border-leather/40 bg-leather/10"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="line-clamp-1 font-heading text-sm text-leather">
                    {npc.name}
                  </div>
                  {npc.gm_only && (
                    <EyeOff className="size-3.5 shrink-0 text-leather/70" />
                  )}
                </div>
                <div className="mt-0.5 line-clamp-1 text-xs font-semibold uppercase tracking-[0.08em] text-leather/70">
                  {npc.status}
                  {npc.tags && npc.tags.length > 0 && (
                    <span className="ml-1.5 normal-case font-medium tracking-normal text-leather/55">
                      · {npc.tags.slice(0, 3).join(" · ")}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );

  const rightPage = selected ? (
    <NpcDetail
      key={selected.id}
      campaignId={campaignId}
      npc={selected}
      role={role}
      userId={userId}
      onDeleted={handleDeleted}
    />
  ) : (
    <div className="flex h-full items-center justify-center text-xs italic text-leather/60">
      Select an NPC to view.
    </div>
  );

  return (
    <OpenBookView
      leftPage={leftPage}
      rightPage={rightPage}
      onBack={() => router.push(`/campaign/${campaignId}`)}
      onNew={isGm ? () => setCreateOpen(true) : undefined}
      newAriaLabel="New NPC"
    >
      {isGm && (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle className="font-heading">New NPC</DialogTitle>
                <DialogDescription>
                  Create an NPC and fill in details inline.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="npc-name">Name</Label>
                  <Input
                    id="npc-name"
                    placeholder="Gareth the Bold"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating || !name.trim()}
                  className="gold-glow"
                >
                  {creating ? "Creating..." : "Create NPC"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </OpenBookView>
  );
}
