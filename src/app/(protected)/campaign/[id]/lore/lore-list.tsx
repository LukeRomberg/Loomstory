"use client";

import { useState, useMemo, useCallback } from "react";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
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
import {
  MasterList,
  MasterListItem,
} from "@/components/shared/master-list";
import { LoreDetail } from "./lore-detail";
import { ChevronLeft, Plus } from "lucide-react";

interface LoreEntry {
  id: string;
  title: string;
  content: string | null;
  tags: string[] | null;
  gm_only: boolean;
}

interface LoreListProps {
  campaignId: string;
  campaignName: string;
  loreEntries: LoreEntry[];
  role: string;
  userId: string;
}

export function LoreList({
  campaignId,
  campaignName: _campaignName,
  loreEntries: initial,
  role,
  userId,
}: LoreListProps) {
  const router = useTransitionRouter();
  const searchParams = useSearchParams();
  const isGm = role === "gm";
  const [loreEntries, setLoreEntries] = useState(initial);
  const [search, setSearch] = useState("");
  const urlSelected = searchParams.get("selected");
  const [selectedId, setSelectedId] = useState<string | null>(
    urlSelected ?? initial[0]?.id ?? null
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return loreEntries;
    const q = search.toLowerCase();
    return loreEntries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.content?.toLowerCase().includes(q) ||
        e.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [loreEntries, search]);

  const selected =
    filtered.find((e) => e.id === selectedId) ?? filtered[0] ?? null;

  const selectEntry = useCallback(
    (id: string) => {
      setSelectedId(id);
      router.replace(`/campaign/${campaignId}/lore?selected=${id}`);
    },
    [campaignId, router]
  );

  const handleDeleted = useCallback(() => {
    if (!selected) return;
    const remaining = loreEntries.filter((e) => e.id !== selected.id);
    setLoreEntries(remaining);
    setSelectedId(remaining[0]?.id ?? null);
  }, [loreEntries, selected]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("lore_entries")
      .insert({
        campaign_id: campaignId,
        title,
        created_by: userId,
        updated_by: userId,
        gm_only: true,
      })
      .select()
      .single();
    if (error || !data) {
      toast.error("Failed to create entry", { description: error?.message });
      setCreating(false);
      return;
    }
    const created: LoreEntry = {
      id: data.id,
      title: data.title,
      content: null,
      tags: null,
      gm_only: true,
      ...data,
    };
    setLoreEntries((prev) => [...prev, created]);
    selectEntry(created.id);
    setCreateOpen(false);
    setTitle("");
    setCreating(false);
    toast.success("Lore entry created");
  }

  return (
    <>
      <div className="fixed inset-0 z-[45] flex items-center justify-center overflow-hidden bg-leather">
        <div
          className="relative w-[min(100vw,calc(100vh*16/9))]"
          style={{ aspectRatio: "16 / 9" }}
        >
          <Image
            src="/textures/lore-book.png"
            alt=""
            fill
            priority
            className="object-contain"
          />

          {/* Back link (top-left) */}
          <button
            onClick={() => router.push(`/campaign/${campaignId}`)}
            aria-label="Back to bookshelf"
            className="absolute left-[3%] top-[4%] z-10 flex items-center gap-1.5 rounded-md bg-leather/70 px-3 py-1.5 text-gold shadow-lg shadow-black/60 ring-1 ring-gold/20 backdrop-blur-sm transition hover:bg-leather/85 hover:text-gold"
          >
            <ChevronLeft className="size-4" />
            <span className="font-subheading text-sm font-bold uppercase tracking-[0.18em]">
              Bookshelf
            </span>
          </button>

          {/* New lore entry (GM only) */}
          {isGm && (
            <button
              onClick={() => setCreateOpen(true)}
              aria-label="New lore entry"
              className="absolute right-[3%] top-[4%] z-10 flex items-center gap-1.5 rounded-md bg-leather/70 px-3 py-1.5 text-gold shadow-lg shadow-black/60 ring-1 ring-gold/20 backdrop-blur-sm transition hover:bg-leather/85 hover:text-gold"
            >
              <Plus className="size-4" />
              <span className="font-subheading text-sm font-bold uppercase tracking-[0.18em]">
                New
              </span>
            </button>
          )}

          {/* LEFT page — master list */}
          <div
            className="absolute flex flex-col gap-3 font-medium text-leather"
            style={{ left: "19%", right: "50%", top: "9%", bottom: "10%" }}
          >
            <MasterList
              title="Lore"
              count={loreEntries.length}
              search={search}
              onSearchChange={setSearch}
              isEmpty={filtered.length === 0}
              emptyMessage={
                loreEntries.length === 0
                  ? "No lore entries yet."
                  : "No matches."
              }
            >
              {filtered.map((entry) => (
                <MasterListItem
                  key={entry.id}
                  selected={selected?.id === entry.id}
                  onClick={() => selectEntry(entry.id)}
                  title={entry.title}
                  hidden={entry.gm_only}
                  subtitle={
                    entry.tags && entry.tags.length > 0
                      ? entry.tags.slice(0, 4).join(" · ")
                      : undefined
                  }
                />
              ))}
            </MasterList>
          </div>

          {/* RIGHT page — detail */}
          <div
            className="absolute flex flex-col gap-3 font-medium text-leather"
            style={{ left: "52%", right: "14%", top: "9%", bottom: "10%" }}
          >
            {selected ? (
              <LoreDetail
                key={selected.id}
                entry={selected}
                role={role}
                onDeleted={handleDeleted}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs italic text-leather/60">
                Select a lore entry to read.
              </div>
            )}
          </div>
        </div>
      </div>

      {isGm && (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle className="font-heading">
                  New Lore Entry
                </DialogTitle>
                <DialogDescription>
                  Create a lore entry and fill in details inline.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="lore-title">Title</Label>
                  <Input
                    id="lore-title"
                    placeholder="The Founding of Ironhold"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
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
                  disabled={creating || !title.trim()}
                  className="gold-glow"
                >
                  {creating ? "Creating..." : "Create Entry"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
