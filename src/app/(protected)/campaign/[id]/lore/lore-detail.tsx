"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  BookCard,
  BookCardContent,
  BookCardHeader,
  BookCardTitle,
} from "@/components/shared/book-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Eye, EyeOff } from "lucide-react";

interface LoreEntry {
  id: string;
  title: string;
  content: string | null;
  tags: string[] | null;
  gm_only: boolean;
}

interface LoreDetailProps {
  entry: LoreEntry;
  role: string;
  onDeleted?: () => void;
}

export function LoreDetail({ entry: initial, role, onDeleted }: LoreDetailProps) {
  const isGm = role === "gm";
  const [entry, setEntry] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState(entry.title);
  const [content, setContent] = useState(entry.content ?? "");
  const [tags, setTags] = useState((entry.tags ?? []).join(", "));

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("lore_entries")
      .update({
        title,
        content: content || null,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        updated_by: user?.id,
      })
      .eq("id", entry.id);

    if (error) {
      toast.error("Failed to save", { description: error.message });
    } else {
      setEntry((prev) => ({
        ...prev,
        title,
        content: content || null,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      }));
      setEditing(false);
      toast.success("Lore entry updated");
    }
    setSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("soft_delete_entity", {
      p_entity_type: "lore_entry",
      p_entity_id: entry.id,
    });
    if (error) {
      toast.error("Failed to delete", { description: error.message });
      setDeleting(false);
      return;
    }
    toast.success("Lore entry archived");
    setDeleteOpen(false);
    setDeleting(false);
    onDeleted?.();
  }

  async function handleToggleVisibility() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const newValue = !entry.gm_only;
    const { error } = await supabase
      .from("lore_entries")
      .update({ gm_only: newValue, updated_by: user?.id })
      .eq("id", entry.id);
    if (error) {
      toast.error("Failed to update visibility", { description: error.message });
      return;
    }
    setEntry((prev) => ({ ...prev, gm_only: newValue }));
    toast.success(newValue ? "Hidden from players" : "Visible to players");
  }

  function cancelEdit() {
    setEditing(false);
    setTitle(entry.title);
    setContent(entry.content ?? "");
    setTags((entry.tags ?? []).join(", "));
  }

  return (
    <div className="scrollbar-none flex h-full flex-col gap-4 overflow-y-auto pr-1 text-leather">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-lg font-semibold uppercase tracking-[0.12em] text-leather sm:text-xl">
            {entry.title}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {entry.gm_only && (
              <Badge
                variant="outline"
                className="border-leather/40 bg-leather/10 text-[11px] font-semibold text-leather"
              >
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
        {isGm && (
          <div className="flex shrink-0 items-center gap-1 text-leather">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleToggleVisibility}
              title={entry.gm_only ? "Make visible to players" : "Hide from players"}
              className="text-leather hover:bg-leather/10 hover:text-leather"
            >
              {entry.gm_only ? (
                <Eye className="size-4" />
              ) : (
                <EyeOff className="size-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setEditing(!editing)}
              className="text-leather hover:bg-leather/10 hover:text-leather"
            >
              <Pencil className="size-4" />
            </Button>
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="hover:bg-leather/10"
                  >
                    <Trash2 className="size-4 text-red-700" />
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete &quot;{entry.title}&quot;?</DialogTitle>
                  <DialogDescription>
                    This will archive the lore entry. All data is preserved.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {editing && isGm ? (
        <BookCard>
          <BookCardHeader>
            <BookCardTitle>Edit Lore Entry</BookCardTitle>
          </BookCardHeader>
          <BookCardContent className="space-y-4 [&_label]:text-leather">
            <div className="space-y-2">
              <Label htmlFor="lore-title">Title</Label>
              <Input
                id="lore-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lore-content">Content</Label>
              <Textarea
                id="lore-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lore-tags">Tags</Label>
              <Input
                id="lore-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="history, geography, magic..."
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} className="gold-glow">
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button
                variant="ghost"
                onClick={cancelEdit}
                className="text-leather hover:bg-leather/10 hover:text-leather"
              >
                Cancel
              </Button>
            </div>
          </BookCardContent>
        </BookCard>
      ) : (
        <div className="space-y-4">
          {entry.content ? (
            <BookCard>
              <BookCardContent className="py-3">
                <p className="whitespace-pre-line text-sm font-lore text-leather">
                  {entry.content}
                </p>
              </BookCardContent>
            </BookCard>
          ) : (
            <p className="text-xs italic text-leather/70">No content yet.</p>
          )}

          {isGm && (
            <div className="pt-1">
              <Button
                variant="outline"
                onClick={() => setEditing(true)}
                className="border-leather/40 bg-transparent text-leather hover:bg-leather/10 hover:text-leather"
              >
                <Pencil className="size-4 mr-1.5" />
                Edit
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
