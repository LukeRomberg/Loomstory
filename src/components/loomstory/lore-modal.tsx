"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MasterDetailModal } from "@/components/shared/master-detail-modal";
import { EntityFormTemplate } from "@/components/shared/entity-form-template";
import { GmOnlyBadge } from "@/components/shared/gm-only-badge";
import { VisibilityToggle } from "@/components/shared/visibility-toggle";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { SectionHeader } from "@/components/loomstory/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil } from "lucide-react";

interface LoreEntry { id: string; title: string; content: string | null; tags: string[] | null; gm_only: boolean; }

interface LoreModalProps { campaignId: string; userId: string; role: string; open: boolean; onOpenChange: (open: boolean) => void; }

export function LoreModal({ campaignId, userId, role, open, onOpenChange }: LoreModalProps) {
  const isGm = role === "gm";
  const [entries, setEntries] = useState<LoreEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [savingCreate, setSavingCreate] = useState(false);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase.from("lore_entries").select("id, title, content, tags, gm_only").eq("campaign_id", campaignId).is("deleted_at", null);
    if (!isGm) query = query.eq("gm_only", false);
    const { data } = await query.order("title");
    setEntries(data ?? []); setLoading(false);
  }, [campaignId, isGm]);

  useEffect(() => { if (open) fetchEntries(); }, [open, fetchEntries]);

  async function handleCreate() {
    setSavingCreate(true);
    const supabase = createClient();
    const { error } = await supabase.from("lore_entries").insert({ campaign_id: campaignId, title: createTitle, created_by: userId, updated_by: userId, gm_only: true }).select().single();
    if (error) { toast.error("Failed to create entry", { description: error.message }); setSavingCreate(false); return; }
    toast.success("Lore entry created"); setCreateTitle(""); setSavingCreate(false); setCreating(false); await fetchEntries();
  }

  return (
    <>
    <MasterDetailModal<LoreEntry>
      title="Lore" open={open} onOpenChange={onOpenChange} items={entries} loading={loading}
      onCreateClick={isGm ? () => setCreating(true) : undefined} createLabel="New Entry"
      emptyMessage="No lore entries yet. Create one to start building your world."
      searchPlaceholder="Search lore..."
      renderListItem={(entry, isSelected) => (
        <div>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${isSelected ? "text-gold" : ""}`}>{entry.title}</span>
            {entry.gm_only && <GmOnlyBadge />}
          </div>
          {entry.content && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{entry.content}</p>}
          {entry.tags && entry.tags.length > 0 && (
            <div className="flex gap-1 mt-1">{entry.tags.slice(0, 3).map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}</div>
          )}
        </div>
      )}
      renderDetail={(entry) => <LoreDetail entry={entry} campaignId={campaignId} role={role} onUpdated={fetchEntries} />}
    />
    <Dialog open={creating} onOpenChange={setCreating}>
      <DialogContent>
        <EntityFormTemplate mode="create" entityType="Lore Entry" onSubmit={handleCreate} onCancel={() => setCreating(false)} saving={savingCreate} disabled={!createTitle.trim()}>
          <div className="space-y-2"><Label htmlFor="create-lore-title">Title</Label><Input id="create-lore-title" placeholder="The Founding of Ironhold" value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} required /></div>
        </EntityFormTemplate>
      </DialogContent>
    </Dialog>
    </>
  );
}

function LoreDetail({ entry: initial, campaignId, role, onUpdated }: { entry: LoreEntry; campaignId: string; role: string; onUpdated: () => void }) {
  const isGm = role === "gm";
  const [entry, setEntry] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingVis, setTogglingVis] = useState(false);
  const [title, setTitle] = useState(entry.title);
  const [content, setContent] = useState(entry.content ?? "");
  const [tags, setTags] = useState((entry.tags ?? []).join(", "));

  useEffect(() => { setEntry(initial); setTitle(initial.title); setContent(initial.content ?? ""); setTags((initial.tags ?? []).join(", ")); setEditing(false); }, [initial]);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("lore_entries").update({ title, content: content || null, tags: tags.split(",").map((t) => t.trim()).filter(Boolean), updated_by: user?.id }).eq("id", entry.id);
    if (error) { toast.error("Failed to save", { description: error.message }); } else { toast.success("Lore entry updated"); setEditing(false); onUpdated(); }
    setSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("soft_delete_entity", { p_entity_type: "lore_entry", p_entity_id: entry.id });
    if (error) { toast.error("Failed to delete"); setDeleting(false); return; }
    toast.success("Lore entry archived"); setDeleteOpen(false); setDeleting(false); onUpdated();
  }

  async function handleToggleVis() {
    setTogglingVis(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("lore_entries").update({ gm_only: !entry.gm_only, updated_by: user?.id }).eq("id", entry.id);
    if (error) { toast.error("Failed to update visibility"); } else { setEntry((p) => ({ ...p, gm_only: !p.gm_only })); toast.success(entry.gm_only ? "Visible to players" : "Hidden"); onUpdated(); }
    setTogglingVis(false);
  }

  if (editing && isGm) {
    return (
      <EntityFormTemplate mode="edit" entityType="Lore Entry" onSubmit={handleSave} onCancel={() => { setEditing(false); setTitle(entry.title); setContent(entry.content ?? ""); setTags((entry.tags ?? []).join(", ")); }} onDelete={() => setDeleteOpen(true)} saving={saving}>
        <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="space-y-2"><Label>Content</Label><Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} /></div>
        <div className="space-y-2"><Label>Tags</Label><Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="history, ironhold, dwarves..." /></div>
        <ConfirmDeleteDialog entityName={entry.title} open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDelete} deleting={deleting} />
      </EntityFormTemplate>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div><h3 className="text-xl font-heading font-semibold">{entry.title}</h3><div className="flex items-center gap-2 mt-1">{entry.gm_only && <GmOnlyBadge />}</div></div>
        {isGm && <VisibilityToggle gmOnly={entry.gm_only} onToggle={handleToggleVis} loading={togglingVis} />}
      </div>
      {entry.content && (<Card className="grain"><CardContent className="py-3"><p className="text-sm font-lore whitespace-pre-wrap">{entry.content}</p></CardContent></Card>)}
      {entry.tags && entry.tags.length > 0 && (<div className="flex flex-wrap gap-1.5">{entry.tags.map((t) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}</div>)}
      {isGm && <div className="pt-2"><Button variant="outline" onClick={() => setEditing(true)}><Pencil className="size-4 mr-1.5" />Edit</Button></div>}
    </div>
  );
}
