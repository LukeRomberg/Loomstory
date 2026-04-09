"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface PlotThread { id: string; title: string; description: string | null; status: string; priority: string; resolution_notes: string | null; gm_notes: string | null; gm_only: boolean; }

interface PlotThreadModalProps { campaignId: string; userId: string; role: string; open: boolean; onOpenChange: (open: boolean) => void; }

export function PlotThreadModal({ campaignId, userId, role, open, onOpenChange }: PlotThreadModalProps) {
  const isGm = role === "gm";
  const [threads, setThreads] = useState<PlotThread[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [savingCreate, setSavingCreate] = useState(false);

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase.from("plot_threads").select("id, title, description, status, priority, resolution_notes, gm_notes, gm_only").eq("campaign_id", campaignId).is("deleted_at", null);
    if (!isGm) query = query.eq("gm_only", false);
    const { data } = await query.order("priority").order("title");
    setThreads(data ?? []); setLoading(false);
  }, [campaignId, isGm]);

  useEffect(() => { if (open) fetchThreads(); }, [open, fetchThreads]);

  async function handleCreate() {
    setSavingCreate(true);
    const supabase = createClient();
    const { error } = await supabase.from("plot_threads").insert({ campaign_id: campaignId, title: createTitle, created_by: userId, updated_by: userId, gm_only: true }).select().single();
    if (error) { toast.error("Failed to create thread", { description: error.message }); setSavingCreate(false); return; }
    toast.success("Plot thread created"); setCreateTitle(""); setSavingCreate(false); setCreating(false); await fetchThreads();
  }

  return (
    <>
    <MasterDetailModal<PlotThread>
      title="Plot Threads" open={open} onOpenChange={onOpenChange} items={threads} loading={loading}
      onCreateClick={isGm ? () => setCreating(true) : undefined} createLabel="New Thread"
      emptyMessage="No plot threads yet. Create one to start tracking story arcs."
      renderListItem={(thread, isSelected) => (
        <div>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${isSelected ? "text-gold" : ""}`}>{thread.title}</span>
            <div className="flex items-center gap-1">
              {thread.gm_only && <GmOnlyBadge />}
              <Badge variant="outline" className="text-xs capitalize">{thread.status}</Badge>
              <Badge variant="secondary" className="text-xs">{thread.priority}</Badge>
            </div>
          </div>
          {thread.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{thread.description}</p>}
        </div>
      )}
      renderDetail={(thread) => <PlotThreadDetail thread={thread} campaignId={campaignId} role={role} onUpdated={fetchThreads} />}
    />
    <Dialog open={creating} onOpenChange={setCreating}>
      <DialogContent>
        <EntityFormTemplate mode="create" entityType="Plot Thread" onSubmit={handleCreate} onCancel={() => setCreating(false)} saving={savingCreate} disabled={!createTitle.trim()}>
          <div className="space-y-2"><Label htmlFor="create-thread-title">Title</Label><Input id="create-thread-title" placeholder="The Crimson Conspiracy" value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} required /></div>
        </EntityFormTemplate>
      </DialogContent>
    </Dialog>
    </>
  );
}

function PlotThreadDetail({ thread: initial, campaignId, role, onUpdated }: { thread: PlotThread; campaignId: string; role: string; onUpdated: () => void }) {
  const isGm = role === "gm";
  const [thread, setThread] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingVis, setTogglingVis] = useState(false);
  const [title, setTitle] = useState(thread.title);
  const [description, setDescription] = useState(thread.description ?? "");
  const [status, setStatus] = useState(thread.status);
  const [priority, setPriority] = useState(thread.priority);
  const [resolutionNotes, setResolutionNotes] = useState(thread.resolution_notes ?? "");
  const [gmNotes, setGmNotes] = useState(thread.gm_notes ?? "");

  useEffect(() => { setThread(initial); setTitle(initial.title); setDescription(initial.description ?? ""); setStatus(initial.status); setPriority(initial.priority); setResolutionNotes(initial.resolution_notes ?? ""); setGmNotes(initial.gm_notes ?? ""); setEditing(false); }, [initial]);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("plot_threads").update({ title, description: description || null, status, priority, resolution_notes: resolutionNotes || null, gm_notes: gmNotes || null, updated_by: user?.id }).eq("id", thread.id);
    if (error) { toast.error("Failed to save", { description: error.message }); } else { toast.success("Plot thread updated"); setEditing(false); onUpdated(); }
    setSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("soft_delete_entity", { p_entity_type: "plot_thread", p_entity_id: thread.id });
    if (error) { toast.error("Failed to delete"); setDeleting(false); return; }
    toast.success("Thread archived"); setDeleteOpen(false); setDeleting(false); onUpdated();
  }

  async function handleToggleVis() {
    setTogglingVis(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("plot_threads").update({ gm_only: !thread.gm_only, updated_by: user?.id }).eq("id", thread.id);
    if (error) { toast.error("Failed to update visibility"); } else { setThread((p) => ({ ...p, gm_only: !p.gm_only })); toast.success(thread.gm_only ? "Visible to players" : "Hidden"); onUpdated(); }
    setTogglingVis(false);
  }

  if (editing && isGm) {
    return (
      <EntityFormTemplate mode="edit" entityType="Plot Thread" onSubmit={handleSave} onCancel={() => { setEditing(false); setTitle(thread.title); setDescription(thread.description ?? ""); setStatus(thread.status); setPriority(thread.priority); setResolutionNotes(thread.resolution_notes ?? ""); setGmNotes(thread.gm_notes ?? ""); }} onDelete={() => setDeleteOpen(true)} saving={saving}>
        <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Status</Label><Select value={status} onValueChange={(v) => setStatus(v ?? "active")}><SelectTrigger><SelectValue>{status}</SelectValue></SelectTrigger><SelectContent>{["active","on_hold","resolved","abandoned"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Priority</Label><Select value={priority} onValueChange={(v) => setPriority(v ?? "side")}><SelectTrigger><SelectValue>{priority}</SelectValue></SelectTrigger><SelectContent>{["main","side","background"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <div className="space-y-2"><Label>Resolution Notes</Label><Textarea value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} rows={2} placeholder="How/when this was resolved..." /></div>
        <div className="space-y-2"><Label>GM Notes</Label><Textarea value={gmNotes} onChange={(e) => setGmNotes(e.target.value)} rows={2} placeholder="Hidden info..." /></div>
        <ConfirmDeleteDialog entityName={thread.title} open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDelete} deleting={deleting} />
      </EntityFormTemplate>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div><h3 className="text-xl font-heading font-semibold">{thread.title}</h3><div className="flex items-center gap-2 mt-1"><Badge variant="outline" className="text-xs capitalize">{thread.status}</Badge><Badge variant="secondary" className="text-xs">{thread.priority}</Badge>{thread.gm_only && <GmOnlyBadge />}</div></div>
        {isGm && <VisibilityToggle gmOnly={thread.gm_only} onToggle={handleToggleVis} loading={togglingVis} />}
      </div>
      {thread.description && (<><SectionHeader>Description</SectionHeader><Card className="grain"><CardContent className="py-3"><p className="text-sm font-lore">{thread.description}</p></CardContent></Card></>)}
      {thread.resolution_notes && (<><SectionHeader>Resolution</SectionHeader><Card className="grain"><CardContent className="py-3"><p className="text-sm">{thread.resolution_notes}</p></CardContent></Card></>)}
      {isGm && thread.gm_notes && (<><Separator /><SectionHeader>GM Notes</SectionHeader><Card className="grain"><CardContent className="py-3"><p className="text-sm italic">{thread.gm_notes}</p></CardContent></Card></>)}
      {isGm && <div className="pt-2"><Button variant="outline" onClick={() => setEditing(true)}><Pencil className="size-4 mr-1.5" />Edit</Button></div>}
    </div>
  );
}
