"use client";

import { useState, useMemo } from "react";
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
import { ChevronLeft, Plus, GitBranch, EyeOff } from "lucide-react";

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
const PRIORITY_COLORS: Record<string, string> = {
  main: "default",
  side: "secondary",
  background: "outline",
};

export function PlotThreadList({ campaignId, campaignName, plotThreads: initial, role, userId }: PlotThreadListProps) {
  const router = useRouter();
  const isGm = role === "gm";
  const [plotThreads] = useState(initial);
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return plotThreads;
    return plotThreads.filter((t) => t.status === statusFilter);
  }, [plotThreads, statusFilter]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("plot_threads")
      .insert({ campaign_id: campaignId, title, created_by: userId, updated_by: userId, gm_only: true })
      .select().single();
    if (error || !data) { toast.error("Failed to create thread", { description: error?.message }); setCreating(false); return; }
    setOpen(false); setTitle(""); setCreating(false);
    toast.success("Plot thread created");
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => router.push(`/campaign/${campaignId}`)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors">
            <ChevronLeft className="size-4" />{campaignName}
          </button>
          <h2 className="text-2xl font-heading font-semibold">Plot Threads</h2>
          <p className="text-sm text-muted-foreground mt-1">{plotThreads.length} thread{plotThreads.length !== 1 ? "s" : ""} in this campaign</p>
        </div>
        {isGm && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button className="gold-glow font-heading"><Plus className="size-4 mr-1.5" />New Thread</Button>} />
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader><DialogTitle className="font-heading">New Plot Thread</DialogTitle><DialogDescription>Create a thread and fill in details later.</DialogDescription></DialogHeader>
                <div className="space-y-4 py-4"><div className="space-y-2"><Label htmlFor="thread-title">Title</Label><Input id="thread-title" placeholder="The Crimson Conspiracy" value={title} onChange={(e) => setTitle(e.target.value)} required /></div></div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={creating || !title.trim()} className="gold-glow">{creating ? "Creating..." : "Create Thread"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-1 mb-4">
        {STATUS_FILTERS.map((s) => (
          <Button key={s} variant={statusFilter === s ? "default" : "ghost"} size="xs" onClick={() => setStatusFilter(s)} className="font-heading capitalize">
            {s === "on_hold" ? "On Hold" : s}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={GitBranch} message={plotThreads.length === 0 ? "No plot threads yet. Create one to start tracking story arcs." : "No threads match the current filter."} action={isGm && plotThreads.length === 0 ? { label: "New Thread", onClick: () => setOpen(true) } : undefined} />
      ) : (
        <div className="space-y-3">
          {filtered.map((thread) => (
            <Card key={thread.id} className="grain gold-glow cursor-pointer" onClick={() => router.push(`/campaign/${campaignId}/plot-threads/${thread.id}`)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="font-heading">{thread.title}</CardTitle>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {thread.gm_only && <Badge variant="secondary" className="text-xs"><EyeOff className="size-3 mr-1" />GM Only</Badge>}
                    <Badge variant="outline" className="text-xs capitalize">{thread.status}</Badge>
                    <Badge variant={PRIORITY_COLORS[thread.priority] as "default" | "secondary" | "outline" ?? "outline"} className="text-xs">{thread.priority}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {thread.description && <p className="text-sm text-muted-foreground line-clamp-2">{thread.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
