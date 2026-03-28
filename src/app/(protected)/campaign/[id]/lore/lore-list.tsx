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
import { ChevronLeft, Plus, BookOpen, EyeOff } from "lucide-react";

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

export function LoreList({ campaignId, campaignName, loreEntries: initial, role, userId }: LoreListProps) {
  const router = useRouter();
  const isGm = role === "gm";
  const [loreEntries] = useState(initial);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return loreEntries;
    const q = search.toLowerCase();
    return loreEntries.filter((e) =>
      e.title.toLowerCase().includes(q) ||
      e.content?.toLowerCase().includes(q) ||
      e.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [loreEntries, search]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("lore_entries")
      .insert({ campaign_id: campaignId, title, created_by: userId, updated_by: userId, gm_only: true })
      .select().single();
    if (error || !data) { toast.error("Failed to create entry", { description: error?.message }); setCreating(false); return; }
    setOpen(false); setTitle(""); setCreating(false);
    toast.success("Lore entry created");
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => router.push(`/campaign/${campaignId}`)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors">
            <ChevronLeft className="size-4" />{campaignName}
          </button>
          <h2 className="text-2xl font-heading font-semibold">Lore</h2>
          <p className="text-sm text-muted-foreground mt-1">{loreEntries.length} entr{loreEntries.length !== 1 ? "ies" : "y"} in this campaign</p>
        </div>
        {isGm && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button className="gold-glow font-heading"><Plus className="size-4 mr-1.5" />New Entry</Button>} />
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader><DialogTitle className="font-heading">New Lore Entry</DialogTitle><DialogDescription>Create a lore entry and fill in details later.</DialogDescription></DialogHeader>
                <div className="space-y-4 py-4"><div className="space-y-2"><Label htmlFor="lore-title">Title</Label><Input id="lore-title" placeholder="The Founding of Ironhold" value={title} onChange={(e) => setTitle(e.target.value)} required /></div></div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={creating || !title.trim()} className="gold-glow">{creating ? "Creating..." : "Create Entry"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input placeholder="Search lore by title, content, or tag..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-[300px]" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={BookOpen} message={loreEntries.length === 0 ? "No lore entries yet. Create one to start building your world." : "No entries match the current search."} action={isGm && loreEntries.length === 0 ? { label: "New Entry", onClick: () => setOpen(true) } : undefined} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((entry) => (
            <Card key={entry.id} className="grain gold-glow cursor-pointer" onClick={() => router.push(`/campaign/${campaignId}/lore/${entry.id}`)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="font-heading">{entry.title}</CardTitle>
                  {entry.gm_only && <Badge variant="secondary" className="text-xs shrink-0 ml-2"><EyeOff className="size-3 mr-1" />GM Only</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                {entry.content && <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{entry.content}</p>}
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {entry.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
