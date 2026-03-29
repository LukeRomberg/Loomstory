"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MasterDetailModal } from "@/components/shared/master-detail-modal";
import { EntityFormTemplate } from "@/components/shared/entity-form-template";
import { GmOnlyBadge } from "@/components/shared/gm-only-badge";
import { VisibilityToggle } from "@/components/shared/visibility-toggle";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { SectionHeader } from "@/components/loomstory/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil } from "lucide-react";

interface Npc {
  id: string;
  name: string;
  aliases: string[] | null;
  description: string | null;
  status: string;
  tags: string[] | null;
  portrait_url: string | null;
  gm_notes: string | null;
  player_notes: string | null;
  gm_only: boolean;
}

interface NpcModalProps {
  campaignId: string;
  userId: string;
  role: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NpcModal({
  campaignId,
  userId,
  role,
  open,
  onOpenChange,
}: NpcModalProps) {
  const router = useRouter();
  const isGm = role === "gm";
  const [npcs, setNpcs] = useState<Npc[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createName, setCreateName] = useState("");
  const [savingCreate, setSavingCreate] = useState(false);

  const fetchNpcs = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("npcs")
      .select("id, name, aliases, description, status, tags, portrait_url, gm_notes, player_notes, gm_only")
      .eq("campaign_id", campaignId)
      .is("deleted_at", null)
      .order("name");
    setNpcs(data ?? []);
    setLoading(false);
  }, [campaignId]);

  useEffect(() => {
    if (open) fetchNpcs();
  }, [open, fetchNpcs]);

  async function handleCreate() {
    setSavingCreate(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("npcs")
      .insert({
        campaign_id: campaignId,
        name: createName,
        created_by: userId,
        updated_by: userId,
        gm_only: true,
      })
      .select()
      .single();

    if (error || !data) {
      toast.error("Failed to create NPC", { description: error?.message });
      setSavingCreate(false);
      return;
    }

    toast.success("NPC created");
    setCreateName("");
    setSavingCreate(false);
    setCreating(false);
    await fetchNpcs();
  }

  return (
    <MasterDetailModal<Npc>
      title="NPCs"
      open={open}
      onOpenChange={onOpenChange}
      items={npcs}
      loading={loading}
      onCreateClick={isGm ? () => setCreating(true) : undefined}
      createLabel="New NPC"
      emptyMessage="No NPCs yet. Process a session or create one manually."
      renderListItem={(npc, isSelected) => (
        <div>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${isSelected ? "text-gold" : ""}`}>
              {npc.name}
            </span>
            <div className="flex items-center gap-1">
              {npc.gm_only && <GmOnlyBadge />}
              <Badge variant="outline" className="text-xs">{npc.status}</Badge>
            </div>
          </div>
          {npc.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {npc.description}
            </p>
          )}
          {npc.tags && npc.tags.length > 0 && (
            <div className="flex gap-1 mt-1">
              {npc.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
              ))}
            </div>
          )}
        </div>
      )}
      renderDetail={(npc) => (
        <NpcDetail
          npc={npc}
          campaignId={campaignId}
          role={role}
          onUpdated={fetchNpcs}
        />
      )}
    />
  );
}

// ─── NPC Detail (sidebar content) ──────────────────────────

function NpcDetail({
  npc: initialNpc,
  campaignId,
  role,
  onUpdated,
}: {
  npc: Npc;
  campaignId: string;
  role: string;
  onUpdated: () => void;
}) {
  const isGm = role === "gm";
  const [npc, setNpc] = useState(initialNpc);
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState(false);

  // Edit form state
  const [name, setName] = useState(npc.name);
  const [aliases, setAliases] = useState((npc.aliases ?? []).join(", "));
  const [description, setDescription] = useState(npc.description ?? "");
  const [status, setStatus] = useState(npc.status);
  const [tags, setTags] = useState((npc.tags ?? []).join(", "));
  const [gmNotes, setGmNotes] = useState(npc.gm_notes ?? "");
  const [playerNotes, setPlayerNotes] = useState(npc.player_notes ?? "");

  // Sync when parent selection changes
  useEffect(() => {
    setNpc(initialNpc);
    setName(initialNpc.name);
    setAliases((initialNpc.aliases ?? []).join(", "));
    setDescription(initialNpc.description ?? "");
    setStatus(initialNpc.status);
    setTags((initialNpc.tags ?? []).join(", "));
    setGmNotes(initialNpc.gm_notes ?? "");
    setPlayerNotes(initialNpc.player_notes ?? "");
    setEditing(false);
  }, [initialNpc]);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("npcs")
      .update({
        name,
        aliases: aliases.split(",").map((a) => a.trim()).filter(Boolean),
        description: description || null,
        status,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        gm_notes: gmNotes || null,
        player_notes: playerNotes || null,
        updated_by: user?.id,
      })
      .eq("id", npc.id);

    if (error) {
      toast.error("Failed to save", { description: error.message });
    } else {
      toast.success("NPC updated");
      setEditing(false);
      onUpdated();
    }
    setSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("npcs")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", npc.id);

    if (error) {
      toast.error("Failed to delete", { description: error.message });
      setDeleting(false);
      return;
    }
    toast.success("NPC archived");
    setDeleteOpen(false);
    setDeleting(false);
    onUpdated();
  }

  async function handleToggleVisibility() {
    setTogglingVisibility(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const newValue = !npc.gm_only;
    const { error } = await supabase
      .from("npcs")
      .update({ gm_only: newValue, updated_by: user?.id })
      .eq("id", npc.id);

    if (error) {
      toast.error("Failed to update visibility", { description: error.message });
    } else {
      setNpc((prev) => ({ ...prev, gm_only: newValue }));
      toast.success(newValue ? "Hidden from players" : "Visible to players");
      onUpdated();
    }
    setTogglingVisibility(false);
  }

  function cancelEdit() {
    setEditing(false);
    setName(npc.name);
    setAliases((npc.aliases ?? []).join(", "));
    setDescription(npc.description ?? "");
    setStatus(npc.status);
    setTags((npc.tags ?? []).join(", "));
    setGmNotes(npc.gm_notes ?? "");
    setPlayerNotes(npc.player_notes ?? "");
  }

  if (editing && isGm) {
    return (
      <EntityFormTemplate
        mode="edit"
        entityType="NPC"
        onSubmit={handleSave}
        onCancel={cancelEdit}
        onDelete={() => setDeleteOpen(true)}
        saving={saving}
      >
        <div className="space-y-2">
          <Label htmlFor="npc-name">Name</Label>
          <Input id="npc-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="npc-aliases">Aliases</Label>
          <Input id="npc-aliases" value={aliases} onChange={(e) => setAliases(e.target.value)} placeholder="nickname, title..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="npc-desc">Description</Label>
          <Textarea id="npc-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v ?? "alive")}>
            <SelectTrigger><SelectValue>{status}</SelectValue></SelectTrigger>
            <SelectContent>
              {["alive", "dead", "unknown", "missing"].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="npc-tags">Tags</Label>
          <Input id="npc-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="ally, merchant..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="npc-gm">GM Notes</Label>
          <Textarea id="npc-gm" value={gmNotes} onChange={(e) => setGmNotes(e.target.value)} rows={3} placeholder="Hidden info..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="npc-player">Player Notes</Label>
          <Textarea id="npc-player" value={playerNotes} onChange={(e) => setPlayerNotes(e.target.value)} rows={3} placeholder="What the party knows..." />
        </div>

        <ConfirmDeleteDialog
          entityName={npc.name}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      </EntityFormTemplate>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-heading font-semibold">{npc.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">{npc.status}</Badge>
            {npc.gm_only && <GmOnlyBadge />}
            {npc.aliases && npc.aliases.length > 0 && (
              <span className="text-xs text-muted-foreground italic">
                aka {npc.aliases.join(", ")}
              </span>
            )}
          </div>
        </div>
        {isGm && (
          <div className="flex items-center gap-1">
            <VisibilityToggle gmOnly={npc.gm_only} onToggle={handleToggleVisibility} loading={togglingVisibility} />
            <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)}>
              <Pencil className="size-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Description */}
      {npc.description && (
        <Card className="grain">
          <CardContent className="py-3">
            <p className="text-sm font-lore">{npc.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {npc.tags && npc.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {npc.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
          ))}
        </div>
      )}

      {/* GM Notes */}
      {isGm && npc.gm_notes && (
        <>
          <Separator />
          <SectionHeader>GM Notes</SectionHeader>
          <Card className="grain">
            <CardContent className="py-3">
              <p className="text-sm italic">{npc.gm_notes}</p>
            </CardContent>
          </Card>
        </>
      )}

      {/* Player Notes */}
      {npc.player_notes && (
        <>
          <Separator />
          <SectionHeader>Player Notes</SectionHeader>
          <Card className="grain">
            <CardContent className="py-3">
              <p className="text-sm">{npc.player_notes}</p>
            </CardContent>
          </Card>
        </>
      )}

      {/* Edit button at bottom */}
      {isGm && (
        <div className="pt-2">
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="size-4 mr-1.5" />
            Edit
          </Button>
        </div>
      )}
    </div>
  );
}
