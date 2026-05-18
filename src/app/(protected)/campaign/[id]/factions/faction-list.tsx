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
import { ChevronRight, EyeOff } from "lucide-react";

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

export function FactionList({
  campaignId,
  campaignName: _campaignName,
  factions: initial,
  role,
  userId,
}: FactionListProps) {
  const router = useTransitionRouter();
  const isGm = role === "gm";
  const [factions] = useState(initial);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initial[0]?.id ?? null);
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

  const selected = filtered.find((f) => f.id === selectedId) ?? filtered[0] ?? null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("factions")
      .insert({ campaign_id: campaignId, name, created_by: userId, updated_by: userId, gm_only: true })
      .select()
      .single();
    if (error || !data) {
      toast.error("Failed to create faction", { description: error?.message });
      setCreating(false);
      return;
    }
    setCreateOpen(false);
    setName("");
    setCreating(false);
    router.push(`/campaign/${campaignId}/factions/${data.id}`);
  }

  const leftPage = (
    <>
      <div className="flex shrink-0 items-center gap-2">
        <h2 className="mr-auto font-heading text-base uppercase tracking-[0.15em] text-leather sm:text-lg">
          Factions{" "}
          <span className="ml-1 font-sans text-xs font-normal text-leather/65 sm:text-sm">
            ({factions.length})
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
            {factions.length === 0 ? "No factions yet." : "No matches."}
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedId(f.id)}
                className={cn(
                  "w-full rounded border border-leather/15 px-3 py-2 text-left transition",
                  "hover:bg-leather/5",
                  selected?.id === f.id && "border-leather/40 bg-leather/10"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="line-clamp-1 font-heading text-sm text-leather">{f.name}</div>
                  {f.gm_only && <EyeOff className="size-3.5 shrink-0 text-leather/70" />}
                </div>
                {f.description && (
                  <div className="mt-0.5 line-clamp-1 text-xs font-medium text-leather/70">
                    {f.description}
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
    <FactionDetail
      faction={selected}
      onOpenFull={() => router.push(`/campaign/${campaignId}/factions/${selected.id}`)}
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
                <DialogDescription>Create a faction and fill in details on the next page.</DialogDescription>
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
                <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating || !name.trim()} className="gold-glow">
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

function FactionDetail({ faction, onOpenFull }: { faction: Faction; onOpenFull: () => void }) {
  return (
    <div className="scrollbar-none flex h-full flex-col gap-3 overflow-y-auto pr-1">
      <div>
        <h3 className="font-heading text-base uppercase tracking-[0.12em] text-leather sm:text-lg">
          {faction.name}
        </h3>
        {faction.gm_only && (
          <div className="mt-1.5">
            <Badge variant="secondary" className="text-[11px] font-semibold">
              <EyeOff className="mr-1 size-3" />
              GM Only
            </Badge>
          </div>
        )}
      </div>

      {faction.goals && (
        <div>
          <div className="mb-1 font-heading text-xs uppercase tracking-[0.1em] text-leather/65">Goals</div>
          <p className="whitespace-pre-line text-sm italic text-leather">{faction.goals}</p>
        </div>
      )}

      {faction.description ? (
        <p className="whitespace-pre-line text-sm text-leather sm:text-base">{faction.description}</p>
      ) : (
        <p className="text-xs italic text-leather/60">No description yet.</p>
      )}

      <button
        onClick={onOpenFull}
        className="mt-2 inline-flex items-center gap-1 font-subheading text-xs font-semibold uppercase tracking-[0.15em] text-leather/85 transition hover:text-leather"
      >
        Open full details
        <ChevronRight className="size-3.5" />
      </button>
    </div>
  );
}
