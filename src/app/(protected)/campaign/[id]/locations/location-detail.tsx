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

interface Location {
  id: string;
  name: string;
  aliases: string[] | null;
  description: string | null;
  type: string | null;
  gm_notes: string | null;
  player_notes: string | null;
  gm_only: boolean;
}

interface LocationDetailProps {
  campaignId: string;
  location: Location;
  role: string;
  userId?: string;
  onDeleted?: () => void;
}

export function LocationDetail({
  campaignId,
  location: initial,
  role,
  userId,
  onDeleted,
}: LocationDetailProps) {
  const isGm = role === "gm";
  const [loc, setLoc] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState(loc.name);
  const [aliases, setAliases] = useState((loc.aliases ?? []).join(", "));
  const [description, setDescription] = useState(loc.description ?? "");
  const [type, setType] = useState(loc.type ?? "");
  const [gmNotes, setGmNotes] = useState(loc.gm_notes ?? "");
  const [playerNotes, setPlayerNotes] = useState(loc.player_notes ?? "");

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("locations")
      .update({
        name,
        aliases: aliases.split(",").map((a) => a.trim()).filter(Boolean),
        description: description || null,
        type: type || null,
        gm_notes: gmNotes || null,
        player_notes: playerNotes || null,
        updated_by: user?.id,
      })
      .eq("id", loc.id);

    if (error) {
      toast.error("Failed to save", { description: error.message });
    } else {
      setLoc((prev) => ({
        ...prev,
        name,
        description: description || null,
        type: type || null,
        gm_notes: gmNotes || null,
        player_notes: playerNotes || null,
        aliases: aliases.split(",").map((a) => a.trim()).filter(Boolean),
      }));
      setEditing(false);
      toast.success("Location updated");
    }
    setSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("soft_delete_entity", {
      p_entity_type: "location",
      p_entity_id: loc.id,
    });
    if (error) {
      toast.error("Failed to delete", { description: error.message });
      setDeleting(false);
      return;
    }
    toast.success("Location archived");
    setDeleteOpen(false);
    setDeleting(false);
    onDeleted?.();
  }

  async function handleToggleVisibility() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const newValue = !loc.gm_only;
    const { error } = await supabase
      .from("locations")
      .update({ gm_only: newValue, updated_by: user?.id })
      .eq("id", loc.id);
    if (error) {
      toast.error("Failed to update visibility", { description: error.message });
      return;
    }
    setLoc((prev) => ({ ...prev, gm_only: newValue }));
    toast.success(newValue ? "Hidden from players" : "Visible to players");
  }

  function cancelEdit() {
    setEditing(false);
    setName(loc.name);
    setAliases((loc.aliases ?? []).join(", "));
    setDescription(loc.description ?? "");
    setType(loc.type ?? "");
    setGmNotes(loc.gm_notes ?? "");
    setPlayerNotes(loc.player_notes ?? "");
  }

  return (
    <div className="scrollbar-none flex h-full flex-col gap-4 overflow-y-auto pr-1 text-leather">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-lg font-semibold uppercase tracking-[0.12em] text-leather sm:text-xl">
            {loc.name}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {loc.type && (
              <Badge
                variant="outline"
                className="border-leather/40 text-[11px] font-semibold uppercase text-leather"
              >
                {loc.type}
              </Badge>
            )}
            {loc.gm_only && (
              <Badge
                variant="outline"
                className="border-leather/40 bg-leather/10 text-[11px] font-semibold text-leather"
              >
                <EyeOff className="mr-1 size-3" />
                GM Only
              </Badge>
            )}
            {loc.aliases && loc.aliases.length > 0 && (
              <span className="text-xs italic text-leather/70">
                aka {loc.aliases.join(", ")}
              </span>
            )}
          </div>
        </div>
        {isGm && (
          <div className="flex shrink-0 items-center gap-1 text-leather">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleToggleVisibility}
              title={loc.gm_only ? "Make visible to players" : "Hide from players"}
              className="text-leather hover:bg-leather/10 hover:text-leather"
            >
              {loc.gm_only ? (
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
                  <DialogTitle>Delete &quot;{loc.name}&quot;?</DialogTitle>
                  <DialogDescription>
                    This will archive the location. All data is preserved.
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
        entityType="location"
        entityId={loc.id}
        entityName={loc.name}
        role={role}
        userId={userId ?? ""}
        overviewContent={
          editing && isGm ? (
            <BookCard>
              <BookCardHeader>
                <BookCardTitle>Edit Location</BookCardTitle>
              </BookCardHeader>
              <BookCardContent className="space-y-4 [&_label]:text-leather">
                <div className="space-y-2">
                  <Label htmlFor="loc-name">Name</Label>
                  <Input id="loc-name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loc-aliases">Aliases</Label>
                  <Input
                    id="loc-aliases"
                    value={aliases}
                    onChange={(e) => setAliases(e.target.value)}
                    placeholder="The Iron City, ..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loc-type">Type</Label>
                  <Input
                    id="loc-type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    placeholder="city, region, dungeon..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loc-desc">Description</Label>
                  <Textarea
                    id="loc-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loc-gm-notes">GM Notes</Label>
                  <Textarea
                    id="loc-gm-notes"
                    value={gmNotes}
                    onChange={(e) => setGmNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loc-player-notes">Player Notes</Label>
                  <Textarea
                    id="loc-player-notes"
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
              {loc.description && (
                <BookCard>
                  <BookCardHeader>
                    <BookCardTitle>Description</BookCardTitle>
                  </BookCardHeader>
                  <BookCardContent>
                    <p className="text-sm font-lore">{loc.description}</p>
                  </BookCardContent>
                </BookCard>
              )}

              {isGm && loc.gm_notes && (
                <>
                  <Separator className="bg-leather/20" />
                  <div>
                    <div className="text-xs font-heading uppercase tracking-wider text-leather/70 mb-2">
                      GM Notes
                    </div>
                    <BookCard>
                      <BookCardContent className="py-3">
                        <p className="text-sm">{loc.gm_notes}</p>
                      </BookCardContent>
                    </BookCard>
                  </div>
                </>
              )}

              {loc.player_notes && (
                <>
                  <Separator className="bg-leather/20" />
                  <div>
                    <div className="text-xs font-heading uppercase tracking-wider text-leather/70 mb-2">
                      Player Notes
                    </div>
                    <BookCard>
                      <BookCardContent className="py-3">
                        <p className="text-sm">{loc.player_notes}</p>
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
