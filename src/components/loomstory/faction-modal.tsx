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

interface Faction { id: string; name: string; description: string | null; goals: string | null; gm_notes: string | null; player_notes: string | null; gm_only: boolean; }

interface FactionModalProps { campaignId: string; userId: string; role: string; open: boolean; onOpenChange: (open: boolean) => void; }

export function FactionModal({ campaignId, userId, role, open, onOpenChange }: FactionModalProps) {
  const isGm = role === "gm";
  const [factions, setFactions] = useState<Faction[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createName, setCreateName] = useState("");
  const [savingCreate, setSavingCreate] = useState(false);

  const fetchFactions = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase.from("factions").select("id, name, description, goals, gm_notes, player_notes, gm_only").eq("campaign_id", campaignId).is("deleted_at", null);
    if (!isGm) query = query.eq("gm_only", false);
    const { data } = await query.order("name");
    setFactions(data ?? []); setLoading(false);
  }, [campaignId, isGm]);

  useEffect(() => { if (open) fetchFactions(); }, [open, fetchFactions]);

  async function handleCreate() {
    setSavingCreate(true);
    const supabase = createClient();
    const { error } = await supabase.from("factions").insert({ campaign_id: campaignId, name: createName, created_by: userId, updated_by: userId, gm_only: true }).select().single();
    if (error) { toast.error("Failed to create faction", { description: error.message }); setSavingCreate(false); return; }
    toast.success("Faction created"); setCreateName(""); setSavingCreate(false); setCreating(false); await fetchFactions();
  }

  return (
    <>
    <MasterDetailModal<Faction>
      title="Factions" open={open} onOpenChange={onOpenChange} items={factions} loading={loading}
      onCreateClick={isGm ? () => setCreating(true) : undefined} createLabel="New Faction"
      emptyMessage="No factions yet. Process a session or create one manually."
      renderListItem={(fac, isSelected) => (
        <div>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${isSelected ? "text-gold" : ""}`}>{fac.name}</span>
            {fac.gm_only && <GmOnlyBadge />}
          </div>
          {fac.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{fac.description}</p>}
        </div>
      )}
      renderDetail={(fac) => <FactionDetail faction={fac} campaignId={campaignId} role={role} onUpdated={fetchFactions} />}
    />
    <Dialog open={creating} onOpenChange={setCreating}>
      <DialogContent>
        <EntityFormTemplate mode="create" entityType="Faction" onSubmit={handleCreate} onCancel={() => setCreating(false)} saving={savingCreate} disabled={!createName.trim()}>
          <div className="space-y-2"><Label htmlFor="create-fac-name">Name</Label><Input id="create-fac-name" placeholder="The Crimson Hand" value={createName} onChange={(e) => setCreateName(e.target.value)} required /></div>
        </EntityFormTemplate>
      </DialogContent>
    </Dialog>
    </>
  );
}

function FactionDetail({ faction: initial, campaignId, role, onUpdated }: { faction: Faction; campaignId: string; role: string; onUpdated: () => void }) {
  const isGm = role === "gm";
  const [fac, setFac] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingVis, setTogglingVis] = useState(false);
  const [name, setName] = useState(fac.name);
  const [description, setDescription] = useState(fac.description ?? "");
  const [goals, setGoals] = useState(fac.goals ?? "");
  const [gmNotes, setGmNotes] = useState(fac.gm_notes ?? "");
  const [playerNotes, setPlayerNotes] = useState(fac.player_notes ?? "");

  useEffect(() => { setFac(initial); setName(initial.name); setDescription(initial.description ?? ""); setGoals(initial.goals ?? ""); setGmNotes(initial.gm_notes ?? ""); setPlayerNotes(initial.player_notes ?? ""); setEditing(false); }, [initial]);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("factions").update({ name, description: description || null, goals: goals || null, gm_notes: gmNotes || null, player_notes: playerNotes || null, updated_by: user?.id }).eq("id", fac.id);
    if (error) { toast.error("Failed to save", { description: error.message }); } else { toast.success("Faction updated"); setEditing(false); onUpdated(); }
    setSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("soft_delete_entity", { p_entity_type: "faction", p_entity_id: fac.id });
    if (error) { toast.error("Failed to delete"); setDeleting(false); return; }
    toast.success("Faction archived"); setDeleteOpen(false); setDeleting(false); onUpdated();
  }

  async function handleToggleVis() {
    setTogglingVis(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("factions").update({ gm_only: !fac.gm_only, updated_by: user?.id }).eq("id", fac.id);
    if (error) { toast.error("Failed to update visibility"); } else { setFac((p) => ({ ...p, gm_only: !p.gm_only })); toast.success(fac.gm_only ? "Visible to players" : "Hidden"); onUpdated(); }
    setTogglingVis(false);
  }

  if (editing && isGm) {
    return (
      <EntityFormTemplate mode="edit" entityType="Faction" onSubmit={handleSave} onCancel={() => { setEditing(false); setName(fac.name); setDescription(fac.description ?? ""); setGoals(fac.goals ?? ""); setGmNotes(fac.gm_notes ?? ""); setPlayerNotes(fac.player_notes ?? ""); }} onDelete={() => setDeleteOpen(true)} saving={saving}>
        <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
        <div className="space-y-2"><Label>Goals</Label><Textarea value={goals} onChange={(e) => setGoals(e.target.value)} rows={2} placeholder="What they want..." /></div>
        <div className="space-y-2"><Label>GM Notes</Label><Textarea value={gmNotes} onChange={(e) => setGmNotes(e.target.value)} rows={2} placeholder="Hidden info..." /></div>
        <div className="space-y-2"><Label>Player Notes</Label><Textarea value={playerNotes} onChange={(e) => setPlayerNotes(e.target.value)} rows={2} placeholder="What the party knows..." /></div>
        <ConfirmDeleteDialog entityName={fac.name} open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDelete} deleting={deleting} />
      </EntityFormTemplate>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div><h3 className="text-xl font-heading font-semibold">{fac.name}</h3><div className="flex items-center gap-2 mt-1">{fac.gm_only && <GmOnlyBadge />}</div></div>
        {isGm && <VisibilityToggle gmOnly={fac.gm_only} onToggle={handleToggleVis} loading={togglingVis} />}
      </div>
      {fac.description && (<><SectionHeader>Description</SectionHeader><Card className="grain"><CardContent className="py-3"><p className="text-sm font-lore">{fac.description}</p></CardContent></Card></>)}
      {fac.goals && (<><SectionHeader>Goals</SectionHeader><Card className="grain"><CardContent className="py-3"><p className="text-sm">{fac.goals}</p></CardContent></Card></>)}
      {isGm && fac.gm_notes && (<><Separator /><SectionHeader>GM Notes</SectionHeader><Card className="grain"><CardContent className="py-3"><p className="text-sm italic">{fac.gm_notes}</p></CardContent></Card></>)}
      {fac.player_notes && (<><Separator /><SectionHeader>Player Notes</SectionHeader><Card className="grain"><CardContent className="py-3"><p className="text-sm">{fac.player_notes}</p></CardContent></Card></>)}
      {isGm && <div className="pt-2"><Button variant="outline" onClick={() => setEditing(true)}><Pencil className="size-4 mr-1.5" />Edit</Button></div>}
    </div>
  );
}
