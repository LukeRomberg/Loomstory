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
import { Separator } from "@/components/ui/separator";
import { EntityDetailTabs } from "@/components/loomstory/entity-detail-tabs";
import { Pencil, Trash2, Eye, EyeOff } from "lucide-react";

interface Faction {
  id: string;
  name: string;
  description: string | null;
  goals: string | null;
  gm_notes: string | null;
  player_notes: string | null;
  gm_only: boolean;
}

interface FactionDetailProps {
  campaignId: string;
  faction: Faction;
  role: string;
  userId?: string;
  onDeleted?: () => void;
}

export function FactionDetail({
  campaignId,
  faction: initial,
  role,
  userId,
  onDeleted,
}: FactionDetailProps) {
  const isGm = role === "gm";
  const [fac, setFac] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState(fac.name);
  const [description, setDescription] = useState(fac.description ?? "");
  const [goals, setGoals] = useState(fac.goals ?? "");
  const [gmNotes, setGmNotes] = useState(fac.gm_notes ?? "");
  const [playerNotes, setPlayerNotes] = useState(fac.player_notes ?? "");

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("factions")
      .update({
        name,
        description: description || null,
        goals: goals || null,
        gm_notes: gmNotes || null,
        player_notes: playerNotes || null,
        updated_by: user?.id,
      })
      .eq("id", fac.id);

    if (error) {
      toast.error("Failed to save", { description: error.message });
    } else {
      setFac((prev) => ({
        ...prev,
        name,
        description: description || null,
        goals: goals || null,
        gm_notes: gmNotes || null,
        player_notes: playerNotes || null,
      }));
      setEditing(false);
      toast.success("Faction updated");
    }
    setSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("soft_delete_entity", {
      p_entity_type: "faction",
      p_entity_id: fac.id,
    });
    if (error) {
      toast.error("Failed to delete", { description: error.message });
      setDeleting(false);
      return;
    }
    toast.success("Faction archived");
    setDeleteOpen(false);
    setDeleting(false);
    onDeleted?.();
  }

  async function handleToggleVisibility() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const newValue = !fac.gm_only;
    const { error } = await supabase
      .from("factions")
      .update({ gm_only: newValue, updated_by: user?.id })
      .eq("id", fac.id);
    if (error) {
      toast.error("Failed to update visibility", { description: error.message });
      return;
    }
    setFac((prev) => ({ ...prev, gm_only: newValue }));
    toast.success(newValue ? "Hidden from players" : "Visible to players");
  }

  function cancelEdit() {
    setEditing(false);
    setName(fac.name);
    setDescription(fac.description ?? "");
    setGoals(fac.goals ?? "");
    setGmNotes(fac.gm_notes ?? "");
    setPlayerNotes(fac.player_notes ?? "");
  }

  return (
    <div className="scrollbar-none flex h-full flex-col gap-4 overflow-y-auto pr-1 text-leather">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-lg font-semibold uppercase tracking-[0.12em] text-leather sm:text-xl">
            {fac.name}
          </h2>
          {fac.gm_only && (
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Badge
                variant="outline"
                className="border-leather/40 bg-leather/10 text-[11px] font-semibold text-leather"
              >
                <EyeOff className="mr-1 size-3" />
                GM Only
              </Badge>
            </div>
          )}
        </div>
        {isGm && (
          <div className="flex shrink-0 items-center gap-1 text-leather">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleToggleVisibility}
              title={fac.gm_only ? "Make visible to players" : "Hide from players"}
              className="text-leather hover:bg-leather/10 hover:text-leather"
            >
              {fac.gm_only ? (
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
                  <DialogTitle>Delete &quot;{fac.name}&quot;?</DialogTitle>
                  <DialogDescription>
                    This will archive the faction. All data is preserved.
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

      <EntityDetailTabs
        campaignId={campaignId}
        entityType="faction"
        entityId={fac.id}
        entityName={fac.name}
        role={role}
        userId={userId ?? ""}
        overviewContent={
          editing && isGm ? (
            <BookCard>
              <BookCardHeader>
                <BookCardTitle>Edit Faction</BookCardTitle>
              </BookCardHeader>
              <BookCardContent className="space-y-4 [&_label]:text-leather">
                <div className="space-y-2">
                  <Label htmlFor="fac-name">Name</Label>
                  <Input id="fac-name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fac-desc">Description</Label>
                  <Textarea
                    id="fac-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fac-goals">Goals</Label>
                  <Textarea
                    id="fac-goals"
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                    rows={2}
                    placeholder="What they want..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fac-gm-notes">GM Notes</Label>
                  <Textarea
                    id="fac-gm-notes"
                    value={gmNotes}
                    onChange={(e) => setGmNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fac-player-notes">Player Notes</Label>
                  <Textarea
                    id="fac-player-notes"
                    value={playerNotes}
                    onChange={(e) => setPlayerNotes(e.target.value)}
                    rows={3}
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
            <div className="space-y-5">
              {fac.description && (
                <BookCard>
                  <BookCardHeader>
                    <BookCardTitle>Description</BookCardTitle>
                  </BookCardHeader>
                  <BookCardContent>
                    <p className="text-sm font-lore">{fac.description}</p>
                  </BookCardContent>
                </BookCard>
              )}

              {fac.goals && (
                <BookCard>
                  <BookCardHeader>
                    <BookCardTitle>Goals</BookCardTitle>
                  </BookCardHeader>
                  <BookCardContent>
                    <p className="text-sm italic">{fac.goals}</p>
                  </BookCardContent>
                </BookCard>
              )}

              {isGm && fac.gm_notes && (
                <>
                  <Separator className="bg-leather/20" />
                  <div>
                    <div className="text-xs font-heading uppercase tracking-wider text-leather/70 mb-2">
                      GM Notes
                    </div>
                    <BookCard>
                      <BookCardContent className="py-3">
                        <p className="text-sm italic">{fac.gm_notes}</p>
                      </BookCardContent>
                    </BookCard>
                  </div>
                </>
              )}

              {fac.player_notes && (
                <>
                  <Separator className="bg-leather/20" />
                  <div>
                    <div className="text-xs font-heading uppercase tracking-wider text-leather/70 mb-2">
                      Player Notes
                    </div>
                    <BookCard>
                      <BookCardContent className="py-3">
                        <p className="text-sm">{fac.player_notes}</p>
                      </BookCardContent>
                    </BookCard>
                  </div>
                </>
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
          )
        }
      />
    </div>
  );
}
