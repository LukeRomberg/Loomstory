"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, EyeOff, Plus } from "lucide-react";

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
  const router = useRouter();
  const isGm = role === "gm";
  const [loreEntries] = useState(initial);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    initial[0]?.id ?? null
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

  const selected = filtered.find((e) => e.id === selectedId) ?? filtered[0] ?? null;

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
    setCreateOpen(false);
    setTitle("");
    setCreating(false);
    toast.success("Lore entry created");
    router.refresh();
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
            {/* Header */}
            <div className="flex shrink-0 items-center gap-2">
              <h2 className="mr-auto font-heading text-base uppercase tracking-[0.15em] text-leather sm:text-lg">
                Lore{" "}
                <span className="ml-1 font-sans text-xs font-normal text-leather/65 sm:text-sm">
                  ({loreEntries.length})
                </span>
              </h2>
              <Input
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-40 border-leather/30 bg-parchment/30 text-xs text-leather placeholder:text-leather/40"
              />
            </div>

            {/* List */}
            <div className="scrollbar-none flex-1 overflow-y-auto pr-1">
              {filtered.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center text-xs italic text-leather/60">
                  {loreEntries.length === 0
                    ? "No lore entries yet."
                    : "No matches."}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filtered.map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => setSelectedId(entry.id)}
                      className={cn(
                        "w-full rounded border border-leather/15 px-3 py-2 text-left transition",
                        "hover:bg-leather/5",
                        selected?.id === entry.id &&
                          "border-leather/40 bg-leather/10"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="line-clamp-1 font-heading text-sm text-leather">
                          {entry.title}
                        </div>
                        {entry.gm_only && (
                          <EyeOff className="size-3.5 shrink-0 text-leather/70" />
                        )}
                      </div>
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="mt-0.5 line-clamp-1 text-xs font-medium text-leather/70">
                          {entry.tags.slice(0, 4).join(" · ")}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT page — detail */}
          <div
            className="absolute flex flex-col gap-3 font-medium text-leather"
            style={{ left: "52%", right: "14%", top: "9%", bottom: "10%" }}
          >
            {selected ? (
              <LoreDetail
                entry={selected}
                onOpenFull={() =>
                  router.push(`/campaign/${campaignId}/lore/${selected.id}`)
                }
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
                  Create a lore entry and fill in details later.
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

function LoreDetail({
  entry,
  onOpenFull,
}: {
  entry: LoreEntry;
  onOpenFull: () => void;
}) {
  return (
    <div className="scrollbar-none flex h-full flex-col gap-3 overflow-y-auto pr-1">
      <div>
        <h3 className="font-heading text-base uppercase tracking-[0.12em] text-leather sm:text-lg">
          {entry.title}
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {entry.gm_only && (
            <Badge variant="secondary" className="text-[11px] font-semibold">
              <EyeOff className="mr-1 size-3" />
              GM Only
            </Badge>
          )}
          {entry.tags?.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="border-leather/40 text-[11px] font-semibold text-leather"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {entry.content ? (
        <p className="whitespace-pre-line text-sm text-leather sm:text-base">
          {entry.content}
        </p>
      ) : (
        <p className="text-xs italic text-leather/60">
          No content yet.
        </p>
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
