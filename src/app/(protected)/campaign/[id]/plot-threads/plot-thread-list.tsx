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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OpenBookView } from "@/components/shared/open-book-view";
import { cn } from "@/lib/utils";
import { EyeOff } from "lucide-react";

interface PlotThread {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  resolution_notes: string | null;
  gm_notes: string | null;
  gm_only: boolean;
}

interface PlotThreadListProps {
  campaignId: string;
  campaignName: string;
  plotThreads: PlotThread[];
  role: string;
  userId: string;
}

const STATUS_FILTERS = ["all", "active", "on_hold", "resolved", "abandoned"];

export function PlotThreadList({
  campaignId,
  campaignName: _campaignName,
  plotThreads: initial,
  role,
  userId,
}: PlotThreadListProps) {
  const router = useTransitionRouter();
  const isGm = role === "gm";
  const [plotThreads] = useState(initial);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initial[0]?.id ?? null);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    let result = plotThreads;
    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [plotThreads, statusFilter, search]);

  const selected = filtered.find((t) => t.id === selectedId) ?? filtered[0] ?? null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("plot_threads")
      .insert({
        campaign_id: campaignId,
        title,
        created_by: userId,
        updated_by: userId,
        status: "active",
        priority: "main",
        gm_only: true,
      })
      .select()
      .single();
    if (error || !data) {
      toast.error("Failed to create plot thread", { description: error?.message });
      setCreating(false);
      return;
    }
    setCreateOpen(false);
    setTitle("");
    setCreating(false);
    toast.success("Plot thread created");
    router.refresh();
  }

  const leftPage = (
    <>
      <div className="flex shrink-0 items-center gap-2">
        <h2 className="mr-auto font-heading text-base uppercase tracking-[0.15em] text-leather sm:text-lg">
          Plot Threads{" "}
          <span className="ml-1 font-sans text-xs font-normal text-leather/65 sm:text-sm">
            ({plotThreads.length})
          </span>
        </h2>
        <Input
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-32 border-leather/30 bg-parchment/30 text-xs text-leather placeholder:text-leather/40"
        />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="h-8 w-28 border-leather/30 bg-parchment/30 text-xs text-leather">
            <SelectValue>{statusFilter === "all" ? "All" : statusFilter}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all" ? "All" : s.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="scrollbar-none flex-1 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-xs italic text-leather/60">
            {plotThreads.length === 0 ? "No plot threads yet." : "No matches."}
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={cn(
                  "w-full rounded border border-leather/15 px-3 py-2 text-left transition",
                  "hover:bg-leather/5",
                  selected?.id === t.id && "border-leather/40 bg-leather/10"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="line-clamp-1 font-heading text-sm text-leather">{t.title}</div>
                  {t.gm_only && <EyeOff className="size-3.5 shrink-0 text-leather/70" />}
                </div>
                <div className="mt-0.5 line-clamp-1 text-xs font-semibold uppercase tracking-[0.08em] text-leather/70">
                  {t.status.replace("_", " ")}
                  <span className="ml-1.5 normal-case font-medium tracking-normal text-leather/55">
                    · {t.priority}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );

  const rightPage = selected ? (
    <PlotThreadDetail thread={selected} isGm={isGm} />
  ) : (
    <div className="flex h-full items-center justify-center text-xs italic text-leather/60">
      Select a plot thread to view.
    </div>
  );

  return (
    <OpenBookView
      leftPage={leftPage}
      rightPage={rightPage}
      onBack={() => router.push(`/campaign/${campaignId}`)}
      onNew={isGm ? () => setCreateOpen(true) : undefined}
      newAriaLabel="New plot thread"
    >
      {isGm && (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle className="font-heading">New Plot Thread</DialogTitle>
                <DialogDescription>Create a plot thread and fill in details later.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="thread-title">Title</Label>
                  <Input
                    id="thread-title"
                    placeholder="The Missing Heir"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating || !title.trim()} className="gold-glow">
                  {creating ? "Creating..." : "Create Thread"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </OpenBookView>
  );
}

function PlotThreadDetail({ thread, isGm }: { thread: PlotThread; isGm: boolean }) {
  return (
    <div className="scrollbar-none flex h-full flex-col gap-3 overflow-y-auto pr-1">
      <div>
        <h3 className="font-heading text-base uppercase tracking-[0.12em] text-leather sm:text-lg">
          {thread.title}
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="border-leather/40 text-[11px] font-semibold uppercase text-leather">
            {thread.status.replace("_", " ")}
          </Badge>
          <Badge variant="outline" className="border-leather/40 text-[11px] font-semibold uppercase text-leather">
            {thread.priority}
          </Badge>
          {thread.gm_only && (
            <Badge variant="secondary" className="text-[11px] font-semibold">
              <EyeOff className="mr-1 size-3" />
              GM Only
            </Badge>
          )}
        </div>
      </div>

      {thread.description ? (
        <p className="whitespace-pre-line text-sm text-leather sm:text-base">{thread.description}</p>
      ) : (
        <p className="text-xs italic text-leather/60">No description yet.</p>
      )}

      {thread.resolution_notes && (
        <div>
          <div className="mb-1 font-heading text-xs uppercase tracking-[0.1em] text-leather/65">Resolution</div>
          <p className="whitespace-pre-line text-sm italic text-leather">{thread.resolution_notes}</p>
        </div>
      )}

      {isGm && thread.gm_notes && (
        <div className="border-t border-leather/30 pt-2">
          <div className="mb-1 font-heading text-xs uppercase tracking-[0.12em] text-leather/70">GM Notes</div>
          <p className="whitespace-pre-line text-sm italic text-leather">{thread.gm_notes}</p>
        </div>
      )}
    </div>
  );
}
