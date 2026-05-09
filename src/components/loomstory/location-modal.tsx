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

interface Location {
  id: string;
  name: string;
  aliases: string[] | null;
  description: string | null;
  type: string | null;
  parent_location_id: string | null;
  map_image_url: string | null;
  gm_notes: string | null;
  player_notes: string | null;
  gm_only: boolean;
}

interface LocationModalProps {
  campaignId: string;
  userId: string;
  role: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LocationModal({ campaignId, userId, role, open, onOpenChange }: LocationModalProps) {
  const isGm = role === "gm";
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createName, setCreateName] = useState("");
  const [savingCreate, setSavingCreate] = useState(false);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from("locations")
      .select("id, name, aliases, description, type, parent_location_id, map_image_url, gm_notes, player_notes, gm_only")
      .eq("campaign_id", campaignId).is("deleted_at", null);
    if (!isGm) query = query.eq("gm_only", false);
    const { data } = await query.order("name");
    setLocations(data ?? []);
    setLoading(false);
  }, [campaignId, isGm]);

  useEffect(() => { if (open) fetchLocations(); }, [open, fetchLocations]);

  async function handleCreate() {
    setSavingCreate(true);
    const supabase = createClient();
    const { error } = await supabase.from("locations")
      .insert({ campaign_id: campaignId, name: createName, created_by: userId, updated_by: userId, gm_only: true })
      .select().single();
    if (error) { toast.error("Failed to create location", { description: error.message }); setSavingCreate(false); return; }
    toast.success("Location created");
    setCreateName(""); setSavingCreate(false); setCreating(false);
    await fetchLocations();
  }

  return (
    <>
    <MasterDetailModal<Location>
      title="Locations" open={open} onOpenChange={onOpenChange} items={locations} loading={loading}
      onCreateClick={isGm ? () => setCreating(true) : undefined} createLabel="New Location"
      emptyMessage="No locations yet. Process a session or create one manually."
      searchPlaceholder="Search locations..."
      renderListItem={(loc, isSelected) => (
        <div>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${isSelected ? "text-gold" : ""}`}>{loc.name}</span>
            <div className="flex items-center gap-1">
              {loc.gm_only && <GmOnlyBadge />}
              {loc.type && <Badge variant="outline" className="text-xs">{loc.type}</Badge>}
            </div>
          </div>
          {loc.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{loc.description}</p>}
        </div>
      )}
      renderDetail={(loc) => <LocationDetail location={loc} campaignId={campaignId} role={role} onUpdated={fetchLocations} />}
    />
    <Dialog open={creating} onOpenChange={setCreating}>
      <DialogContent>
        <EntityFormTemplate mode="create" entityType="Location" onSubmit={handleCreate} onCancel={() => setCreating(false)} saving={savingCreate} disabled={!createName.trim()}>
          <div className="space-y-2"><Label htmlFor="create-loc-name">Name</Label><Input id="create-loc-name" placeholder="Ironhold" value={createName} onChange={(e) => setCreateName(e.target.value)} required /></div>
        </EntityFormTemplate>
      </DialogContent>
    </Dialog>
    </>
  );
}

function LocationDetail({ location: initial, campaignId, role, onUpdated }: { location: Location; campaignId: string; role: string; onUpdated: () => void }) {
  const isGm = role === "gm";
  const [loc, setLoc] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingVis, setTogglingVis] = useState(false);

  const [name, setName] = useState(loc.name);
  const [aliases, setAliases] = useState((loc.aliases ?? []).join(", "));
  const [description, setDescription] = useState(loc.description ?? "");
  const [locType, setLocType] = useState(loc.type ?? "");
  const [gmNotes, setGmNotes] = useState(loc.gm_notes ?? "");
  const [playerNotes, setPlayerNotes] = useState(loc.player_notes ?? "");

  useEffect(() => {
    setLoc(initial); setName(initial.name); setAliases((initial.aliases ?? []).join(", "));
    setDescription(initial.description ?? ""); setLocType(initial.type ?? "");
    setGmNotes(initial.gm_notes ?? ""); setPlayerNotes(initial.player_notes ?? ""); setEditing(false);
  }, [initial]);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("locations").update({
      name, aliases: aliases.split(",").map((a) => a.trim()).filter(Boolean),
      description: description || null, type: locType || null,
      gm_notes: gmNotes || null, player_notes: playerNotes || null, updated_by: user?.id,
    }).eq("id", loc.id);
    if (error) { toast.error("Failed to save", { description: error.message }); } else { toast.success("Location updated"); setEditing(false); onUpdated(); }
    setSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("soft_delete_entity", { p_entity_type: "location", p_entity_id: loc.id });
    if (error) { toast.error("Failed to delete", { description: error.message }); setDeleting(false); return; }
    toast.success("Location archived"); setDeleteOpen(false); setDeleting(false); onUpdated();
  }

  async function handleToggleVis() {
    setTogglingVis(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("locations").update({ gm_only: !loc.gm_only, updated_by: user?.id }).eq("id", loc.id);
    if (error) { toast.error("Failed to update visibility"); } else { setLoc((p) => ({ ...p, gm_only: !p.gm_only })); toast.success(loc.gm_only ? "Visible to players" : "Hidden from players"); onUpdated(); }
    setTogglingVis(false);
  }

  if (editing && isGm) {
    return (
      <EntityFormTemplate mode="edit" entityType="Location" onSubmit={handleSave} onCancel={() => { setEditing(false); setName(loc.name); setAliases((loc.aliases ?? []).join(", ")); setDescription(loc.description ?? ""); setLocType(loc.type ?? ""); setGmNotes(loc.gm_notes ?? ""); setPlayerNotes(loc.player_notes ?? ""); }} onDelete={() => setDeleteOpen(true)} saving={saving}>
        <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="space-y-2"><Label>Aliases</Label><Input value={aliases} onChange={(e) => setAliases(e.target.value)} placeholder="short name, alternate..." /></div>
        <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
        <div className="space-y-2"><Label>Type</Label>
          <Select value={locType} onValueChange={(v) => setLocType(v ?? "")}>
            <SelectTrigger><SelectValue>{locType || "Select type..."}</SelectValue></SelectTrigger>
            <SelectContent>{["city","town","village","dungeon","wilderness","building","district","region","other"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>GM Notes</Label><Textarea value={gmNotes} onChange={(e) => setGmNotes(e.target.value)} rows={2} placeholder="Hidden info..." /></div>
        <div className="space-y-2"><Label>Player Notes</Label><Textarea value={playerNotes} onChange={(e) => setPlayerNotes(e.target.value)} rows={2} placeholder="What the party knows..." /></div>
        <ConfirmDeleteDialog entityName={loc.name} open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDelete} deleting={deleting} />
      </EntityFormTemplate>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-heading font-semibold">{loc.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            {loc.type && <Badge variant="outline" className="text-xs">{loc.type}</Badge>}
            {loc.gm_only && <GmOnlyBadge />}
            {loc.aliases && loc.aliases.length > 0 && <span className="text-xs text-muted-foreground italic">aka {loc.aliases.join(", ")}</span>}
          </div>
        </div>
        {isGm && <VisibilityToggle gmOnly={loc.gm_only} onToggle={handleToggleVis} loading={togglingVis} />}
      </div>
      {loc.description && (<><SectionHeader>Description</SectionHeader><Card className="grain"><CardContent className="py-3"><p className="text-sm font-lore">{loc.description}</p></CardContent></Card></>)}
      {isGm && loc.gm_notes && (<><Separator /><SectionHeader>GM Notes</SectionHeader><Card className="grain"><CardContent className="py-3"><p className="text-sm italic">{loc.gm_notes}</p></CardContent></Card></>)}
      {loc.player_notes && (<><Separator /><SectionHeader>Player Notes</SectionHeader><Card className="grain"><CardContent className="py-3"><p className="text-sm">{loc.player_notes}</p></CardContent></Card></>)}
      {isGm && <div className="pt-2"><Button variant="outline" onClick={() => setEditing(true)}><Pencil className="size-4 mr-1.5" />Edit</Button></div>}
    </div>
  );
}
