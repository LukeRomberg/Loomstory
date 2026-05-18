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
import {
  MasterList,
  MasterListItem,
} from "@/components/shared/master-list";
import { FactionDetail } from "./faction-detail";

interface Faction {
  id: string;
  name: string;
  description: string | null;
  goals: string | null;
  gm_notes: string | null;
  player_notes: string | null;
  gm_only: boolean;
}

interface FactionListProps {
  campaignId: string;
  campaignName: string;
  factions: Faction[];
  role: string;
  userId: string;
}

export function FactionList({
  campaignId,
  campaignName: _campaignName,
  factions: initial,
  role,
  userId,
}: FactionListProps) {
  const router = useTransitionRouter();
  const searchParams = useSearchParams();
  const isGm = role === "gm";
  const [factions, setFactions] = useState(initial);
  const [search, setSearch] = useState("");
  const urlSelected = searchParams.get("selected");
  const [selectedId, setSelectedId] = useState<string | null>(
    urlSelected ?? initial[0]?.id ?? null
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return factions;
    const q = search.toLowerCase();
    return factions.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.description?.toLowerCase().includes(q) ||
        f.goals?.toLowerCase().includes(q)
    );
  }, [factions, search]);

  const selected =
    filtered.find((f) => f.id === selectedId) ?? filtered[0] ?? null;

  const selectFaction = useCallback(
    (id: string) => {
      setSelectedId(id);
      router.replace(`/campaign/${campaignId}/factions?selected=${id}`);
    },
    [campaignId, router]
  );

  const handleDeleted = useCallback(() => {
    if (!selected) return;
    const remaining = factions.filter((f) => f.id !== selected.id);
    setFactions(remaining);
    setSelectedId(remaining[0]?.id ?? null);
  }, [factions, selected]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("factions")
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
      toast.error("Failed to create faction", { description: error?.message });
      setCreating(false);
      return;
    }
    const created: Faction = {
      id: data.id,
      name: data.name,
      description: null,
      goals: null,
      gm_notes: null,
      player_notes: null,
      gm_only: true,
      ...data,
    };
    setFactions((prev) => [...prev, created]);
    selectFaction(created.id);
    setCreateOpen(false);
    setName("");
    setCreating(false);
    toast.success("Faction created");
  }

  const leftPage = (
    <MasterList
      title="Factions"
      count={factions.length}
      search={search}
      onSearchChange={setSearch}
      isEmpty={filtered.length === 0}
      emptyMessage={factions.length === 0 ? "No factions yet." : "No matches."}
    >
      {filtered.map((f) => (
        <MasterListItem
          key={f.id}
          selected={selected?.id === f.id}
          onClick={() => selectFaction(f.id)}
          title={f.name}
          hidden={f.gm_only}
          subtitle={
            f.description ? (
              <span className="line-clamp-1 normal-case font-medium tracking-normal text-leather/70">
                {f.description}
              </span>
            ) : undefined
          }
        />
      ))}
    </MasterList>
  );

  const rightPage = selected ? (
    <FactionDetail
      key={selected.id}
      campaignId={campaignId}
      faction={selected}
      role={role}
      userId={userId}
      onDeleted={handleDeleted}
    />
  ) : (
    <div className="flex h-full items-center justify-center text-xs italic text-leather/60">
      Select a faction to view.
    </div>
  );

  return (
    <OpenBookView
      leftPage={leftPage}
      rightPage={rightPage}
      onBack={() => router.push(`/campaign/${campaignId}`)}
      onNew={isGm ? () => setCreateOpen(true) : undefined}
      newAriaLabel="New faction"
    >
      {isGm && (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle className="font-heading">New Faction</DialogTitle>
                <DialogDescription>
                  Create a faction and fill in details inline.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="faction-name">Name</Label>
                  <Input
                    id="faction-name"
                    placeholder="The Crimson Hand"
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
                  {creating ? "Creating..." : "Create Faction"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </OpenBookView>
  );
}
