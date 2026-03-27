"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SectionHeader } from "@/components/loomstory/section-header";
import { ChevronLeft, Pencil, Trash2, Eye, EyeOff, X } from "lucide-react";

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
  last_location_id: string | null;
}

interface NpcDetailProps {
  campaignId: string;
  campaignName: string;
  npc: Npc;
  role: string;
  userId?: string;
}

export function NpcDetail({ campaignId, campaignName, npc: initialNpc, role }: NpcDetailProps) {
  const router = useRouter();
  const isGm = role === "gm";
  const [npc, setNpc] = useState(initialNpc);
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit form state
  const [name, setName] = useState(npc.name);
  const [aliases, setAliases] = useState((npc.aliases ?? []).join(", "));
  const [description, setDescription] = useState(npc.description ?? "");
  const [status, setStatus] = useState(npc.status);
  const [tags, setTags] = useState((npc.tags ?? []).join(", "));
  const [gmNotes, setGmNotes] = useState(npc.gm_notes ?? "");
  const [playerNotes, setPlayerNotes] = useState(npc.player_notes ?? "");

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
      setNpc((prev) => ({
        ...prev, name, description: description || null, status, gm_notes: gmNotes || null, player_notes: playerNotes || null,
        aliases: aliases.split(",").map((a) => a.trim()).filter(Boolean),
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      }));
      setEditing(false);
      toast.success("NPC updated");
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
    router.push(`/campaign/${campaignId}/npcs`);
    router.refresh();
  }

  async function handleToggleVisibility() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const newValue = !npc.gm_only;
    const { error } = await supabase
      .from("npcs")
      .update({ gm_only: newValue, updated_by: user?.id })
      .eq("id", npc.id);

    if (error) {
      toast.error("Failed to update visibility", { description: error.message });
      return;
    }
    setNpc((prev) => ({ ...prev, gm_only: newValue }));
    toast.success(newValue ? "Hidden from players" : "Visible to players");
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

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.push(`/campaign/${campaignId}/npcs`)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
          >
            <ChevronLeft className="size-4" />
            {campaignName} — NPCs
          </button>
          <h2 className="text-2xl font-heading font-semibold">{npc.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">{npc.status}</Badge>
            {npc.gm_only && (
              <Badge variant="secondary" className="text-xs"><EyeOff className="size-3 mr-1" />GM Only</Badge>
            )}
            {npc.aliases && npc.aliases.length > 0 && (
              <span className="text-xs text-muted-foreground italic">
                aka {npc.aliases.join(", ")}
              </span>
            )}
          </div>
        </div>
        {isGm && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={handleToggleVisibility} title={npc.gm_only ? "Make visible to players" : "Hide from players"}>
              {npc.gm_only ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setEditing(!editing)}>
              <Pencil className="size-4" />
            </Button>
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger render={<Button variant="ghost" size="icon-sm"><Trash2 className="size-4 text-red-400" /></Button>} />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete &quot;{npc.name}&quot;?</DialogTitle>
                  <DialogDescription>This will archive the NPC. All data is preserved.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting..." : "Delete"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Edit Mode */}
      {editing && isGm ? (
        <Card className="grain">
          <CardHeader>
            <CardTitle className="font-heading">Edit NPC</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aliases">Aliases</Label>
              <Input id="aliases" value={aliases} onChange={(e) => setAliases(e.target.value)} placeholder="nickname, title..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v ?? "alive")}>
                <SelectTrigger id="status">
                  <SelectValue>{status}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {["alive", "dead", "unknown", "missing"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="ally, merchant..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gm-notes">GM Notes</Label>
              <Textarea id="gm-notes" value={gmNotes} onChange={(e) => setGmNotes(e.target.value)} rows={3} placeholder="Hidden info..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="player-notes">Player Notes</Label>
              <Textarea id="player-notes" value={playerNotes} onChange={(e) => setPlayerNotes(e.target.value)} rows={3} placeholder="What the party knows..." />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} className="gold-glow">{saving ? "Saving..." : "Save"}</Button>
              <Button variant="ghost" onClick={cancelEdit}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Read Mode */
        <>
          {npc.description && (
            <Card className="grain">
              <CardHeader><CardTitle className="font-heading text-sm">Description</CardTitle></CardHeader>
              <CardContent><p className="text-sm font-lore">{npc.description}</p></CardContent>
            </Card>
          )}

          {npc.tags && npc.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {npc.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}

          {isGm && npc.gm_notes && (
            <>
              <Separator />
              <div>
                <SectionHeader>GM Notes</SectionHeader>
                <Card className="grain">
                  <CardContent className="py-3"><p className="text-sm">{npc.gm_notes}</p></CardContent>
                </Card>
              </div>
            </>
          )}

          {npc.player_notes && (
            <>
              <Separator />
              <div>
                <SectionHeader>Player Notes</SectionHeader>
                <Card className="grain">
                  <CardContent className="py-3"><p className="text-sm">{npc.player_notes}</p></CardContent>
                </Card>
              </div>
            </>
          )}

          {isGm && (
            <div className="pt-2">
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="size-4 mr-1.5" />
                Edit
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
