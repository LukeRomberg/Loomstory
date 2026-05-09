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

interface Item { id: string; name: string; description: string | null; type: string | null; mechanical_properties: Record<string, unknown> | null; gm_notes: string | null; player_notes: string | null; gm_only: boolean; }

const ITEM_TYPES = ["weapon","armor","magical_item","scroll","grimoire","potion","quest_item","tool","gear","trinket","document","currency","other"];

interface ItemModalProps { campaignId: string; userId: string; role: string; open: boolean; onOpenChange: (open: boolean) => void; }

export function ItemModal({ campaignId, userId, role, open, onOpenChange }: ItemModalProps) {
  const isGm = role === "gm";
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createName, setCreateName] = useState("");
  const [savingCreate, setSavingCreate] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase.from("items").select("id, name, description, type, mechanical_properties, gm_notes, player_notes, gm_only").eq("campaign_id", campaignId).is("deleted_at", null);
    if (!isGm) query = query.eq("gm_only", false);
    const { data } = await query.order("name");
    setItems(data ?? []); setLoading(false);
  }, [campaignId, isGm]);

  useEffect(() => { if (open) fetchItems(); }, [open, fetchItems]);

  async function handleCreate() {
    setSavingCreate(true);
    const supabase = createClient();
    const { error } = await supabase.from("items").insert({ campaign_id: campaignId, name: createName, created_by: userId, updated_by: userId, gm_only: true }).select().single();
    if (error) { toast.error("Failed to create item", { description: error.message }); setSavingCreate(false); return; }
    toast.success("Item created"); setCreateName(""); setSavingCreate(false); setCreating(false); await fetchItems();
  }

  return (
    <>
    <MasterDetailModal<Item>
      title="Items" open={open} onOpenChange={onOpenChange} items={items} loading={loading}
      onCreateClick={isGm ? () => setCreating(true) : undefined} createLabel="New Item"
      emptyMessage="No items yet. Process a session or create one manually."
      searchPlaceholder="Search items..."
      renderListItem={(item, isSelected) => (
        <div>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${isSelected ? "text-gold" : ""}`}>{item.name}</span>
            <div className="flex items-center gap-1">
              {item.gm_only && <GmOnlyBadge />}
              {item.type && <Badge variant="outline" className="text-xs">{item.type}</Badge>}
            </div>
          </div>
          {item.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.description}</p>}
        </div>
      )}
      renderDetail={(item) => <ItemDetail item={item} campaignId={campaignId} role={role} onUpdated={fetchItems} />}
    />
    <Dialog open={creating} onOpenChange={setCreating}>
      <DialogContent>
        <EntityFormTemplate mode="create" entityType="Item" onSubmit={handleCreate} onCancel={() => setCreating(false)} saving={savingCreate} disabled={!createName.trim()}>
          <div className="space-y-2"><Label htmlFor="create-item-name">Name</Label><Input id="create-item-name" placeholder="Flame Tongue Longsword" value={createName} onChange={(e) => setCreateName(e.target.value)} required /></div>
        </EntityFormTemplate>
      </DialogContent>
    </Dialog>
    </>
  );
}

function ItemDetail({ item: initial, campaignId, role, onUpdated }: { item: Item; campaignId: string; role: string; onUpdated: () => void }) {
  const isGm = role === "gm";
  const [item, setItem] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingVis, setTogglingVis] = useState(false);
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description ?? "");
  const [itemType, setItemType] = useState(item.type ?? "");
  const [gmNotes, setGmNotes] = useState(item.gm_notes ?? "");
  const [playerNotes, setPlayerNotes] = useState(item.player_notes ?? "");

  useEffect(() => { setItem(initial); setName(initial.name); setDescription(initial.description ?? ""); setItemType(initial.type ?? ""); setGmNotes(initial.gm_notes ?? ""); setPlayerNotes(initial.player_notes ?? ""); setEditing(false); }, [initial]);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("items").update({ name, description: description || null, type: itemType || null, gm_notes: gmNotes || null, player_notes: playerNotes || null, updated_by: user?.id }).eq("id", item.id);
    if (error) { toast.error("Failed to save", { description: error.message }); } else { toast.success("Item updated"); setEditing(false); onUpdated(); }
    setSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("soft_delete_entity", { p_entity_type: "item", p_entity_id: item.id });
    if (error) { toast.error("Failed to delete"); setDeleting(false); return; }
    toast.success("Item archived"); setDeleteOpen(false); setDeleting(false); onUpdated();
  }

  async function handleToggleVis() {
    setTogglingVis(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("items").update({ gm_only: !item.gm_only, updated_by: user?.id }).eq("id", item.id);
    if (error) { toast.error("Failed to update visibility"); } else { setItem((p) => ({ ...p, gm_only: !p.gm_only })); toast.success(item.gm_only ? "Visible to players" : "Hidden"); onUpdated(); }
    setTogglingVis(false);
  }

  if (editing && isGm) {
    return (
      <EntityFormTemplate mode="edit" entityType="Item" onSubmit={handleSave} onCancel={() => { setEditing(false); setName(item.name); setDescription(item.description ?? ""); setItemType(item.type ?? ""); setGmNotes(item.gm_notes ?? ""); setPlayerNotes(item.player_notes ?? ""); }} onDelete={() => setDeleteOpen(true)} saving={saving}>
        <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
        <div className="space-y-2"><Label>Type</Label>
          <Select value={itemType} onValueChange={(v) => setItemType(v ?? "")}>
            <SelectTrigger><SelectValue>{itemType || "Select type..."}</SelectValue></SelectTrigger>
            <SelectContent>{ITEM_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>GM Notes</Label><Textarea value={gmNotes} onChange={(e) => setGmNotes(e.target.value)} rows={2} placeholder="Hidden properties, curses..." /></div>
        <div className="space-y-2"><Label>Player Notes</Label><Textarea value={playerNotes} onChange={(e) => setPlayerNotes(e.target.value)} rows={2} placeholder="What the party knows..." /></div>
        <ConfirmDeleteDialog entityName={item.name} open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDelete} deleting={deleting} />
      </EntityFormTemplate>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div><h3 className="text-xl font-heading font-semibold">{item.name}</h3><div className="flex items-center gap-2 mt-1">{item.type && <Badge variant="outline" className="text-xs">{item.type}</Badge>}{item.gm_only && <GmOnlyBadge />}</div></div>
        {isGm && <VisibilityToggle gmOnly={item.gm_only} onToggle={handleToggleVis} loading={togglingVis} />}
      </div>
      {item.description && (<><SectionHeader>Description</SectionHeader><Card className="grain"><CardContent className="py-3"><p className="text-sm font-lore">{item.description}</p></CardContent></Card></>)}
      {isGm && item.gm_notes && (<><Separator /><SectionHeader>GM Notes</SectionHeader><Card className="grain"><CardContent className="py-3"><p className="text-sm italic">{item.gm_notes}</p></CardContent></Card></>)}
      {item.player_notes && (<><Separator /><SectionHeader>Player Notes</SectionHeader><Card className="grain"><CardContent className="py-3"><p className="text-sm">{item.player_notes}</p></CardContent></Card></>)}
      {isGm && <div className="pt-2"><Button variant="outline" onClick={() => setEditing(true)}><Pencil className="size-4 mr-1.5" />Edit</Button></div>}
    </div>
  );
}
