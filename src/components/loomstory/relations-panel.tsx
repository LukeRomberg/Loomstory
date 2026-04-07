"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SectionHeader } from "@/components/loomstory/section-header";
import { EmptyState } from "@/components/loomstory/empty-state";
import { Plus, X, Pencil, Link2, ArrowRight } from "lucide-react";

interface Relation {
  id: string;
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
  relation_type: string;
  description: string | null;
  source_name?: string;
  target_name?: string;
}

interface RelationType {
  id: string;
  label: string;
}

interface KnownEntity {
  id: string;
  name: string;
  entity_type: string;
}

const ENTITY_ROUTES: Record<string, string> = {
  npc: "npcs",
  location: "locations",
  faction: "factions",
  item: "items",
  character: "characters",
};

interface RelationsPanelProps {
  campaignId: string;
  entityType: string;
  entityId: string;
  entityName: string;
  relations: Relation[];
  relationTypes: RelationType[];
  knownEntities: KnownEntity[];
  role: string;
  userId: string;
}

export function RelationsPanel({
  campaignId,
  entityType,
  entityId,
  entityName,
  relations: initialRelations,
  relationTypes,
  knownEntities,
  role,
  userId,
}: RelationsPanelProps) {
  const router = useRouter();
  const isGm = role === "gm";
  const [relations, setRelations] = useState(initialRelations);
  const [addOpen, setAddOpen] = useState(false);
  const [targetId, setTargetId] = useState("");
  const [relationType, setRelationType] = useState("");
  const [description, setDescription] = useState("");
  const [adding, setAdding] = useState(false);

  function getOtherEntity(rel: Relation) {
    if (rel.source_id === entityId) {
      return {
        id: rel.target_id,
        type: rel.target_type,
        name: rel.target_name ?? "Unknown",
      };
    }
    return {
      id: rel.source_id,
      type: rel.source_type,
      name: rel.source_name ?? "Unknown",
    };
  }

  function getRelationLabel(typeId: string) {
    return relationTypes.find((t) => t.id === typeId)?.label ?? typeId;
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);

    const target = knownEntities.find((e) => e.id === targetId);
    if (!target) {
      toast.error("Please select an entity");
      setAdding(false);
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("entity_relations")
      .insert({
        campaign_id: campaignId,
        source_type: entityType,
        source_id: entityId,
        target_type: target.entity_type,
        target_id: target.id,
        relation_type: relationType || "knows",
        description: description || null,
        created_by: userId,
      })
      .select()
      .single();

    if (error || !data) {
      toast.error("Failed to add relationship", { description: error?.message });
      setAdding(false);
      return;
    }

    setRelations((prev) => [
      ...prev,
      { ...data, source_name: entityName, target_name: target.name },
    ]);
    setAddOpen(false);
    setTargetId("");
    setRelationType("");
    setDescription("");
    setAdding(false);
    toast.success("Relationship added");
  }

  async function handleRemove(relationId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("entity_relations")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", relationId);

    if (error) {
      toast.error("Failed to remove", { description: error.message });
      return;
    }

    setRelations((prev) => prev.filter((r) => r.id !== relationId));
    toast.success("Relationship removed");
  }

  // Edit relation
  const [editOpen, setEditOpen] = useState(false);
  const [editingRelation, setEditingRelation] = useState<Relation | null>(null);
  const [editTargetId, setEditTargetId] = useState("");
  const [editRelationType, setEditRelationType] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  function openEdit(rel: Relation) {
    setEditingRelation(rel);
    const other = getOtherEntity(rel);
    setEditTargetId(other.id);
    setEditRelationType(rel.relation_type);
    setEditDescription(rel.description ?? "");
    setEditOpen(true);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRelation) return;
    setSavingEdit(true);

    const target = knownEntities.find((e) => e.id === editTargetId);
    if (!target) {
      toast.error("Please select an entity");
      setSavingEdit(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("entity_relations")
      .update({
        target_type: target.entity_type,
        target_id: target.id,
        relation_type: editRelationType || "knows",
        description: editDescription || null,
      })
      .eq("id", editingRelation.id);

    if (error) {
      toast.error("Failed to update", { description: error.message });
      setSavingEdit(false);
      return;
    }

    setRelations((prev) =>
      prev.map((r) =>
        r.id === editingRelation.id
          ? {
              ...r,
              target_type: target.entity_type,
              target_id: target.id,
              target_name: target.name,
              source_type: entityType,
              source_id: entityId,
              source_name: entityName,
              relation_type: editRelationType,
              description: editDescription || null,
            }
          : r
      )
    );
    setEditOpen(false);
    setEditingRelation(null);
    setSavingEdit(false);
    toast.success("Relationship updated");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader className="flex items-center gap-2 mb-0">
          <Link2 className="size-4 text-gold" />
          Relationships
          <Badge variant="outline" className="text-xs ml-1">
            {relations.length}
          </Badge>
        </SectionHeader>
        {isGm && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger
              render={
                <Button variant="outline" size="sm">
                  <Plus className="size-4 mr-1" />
                  Add Relationship
                </Button>
              }
            />
            <DialogContent>
              <form onSubmit={handleAdd}>
                <DialogHeader>
                  <DialogTitle className="font-heading">
                    New Relationship
                  </DialogTitle>
                  <DialogDescription>
                    Add a relationship from {entityName} to another entity.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Related Entity</Label>
                    <Select value={targetId} onValueChange={(v) => setTargetId(v ?? "")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select entity...">
                          {targetId ? knownEntities.find((e) => e.id === targetId)?.name : undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {(knownEntities ?? [])
                          .filter((e) => e.id !== entityId)
                          .map((e) => (
                            <SelectItem key={e.id} value={e.id}>
                              <span className="flex items-center gap-1.5">
                                <Badge variant="outline" className="text-[10px] px-1">
                                  {e.entity_type}
                                </Badge>
                                {e.name}
                              </span>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Relationship Type</Label>
                    <Select value={relationType} onValueChange={(v) => setRelationType(v ?? "")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type...">
                          {relationType ? getRelationLabel(relationType) : undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {relationTypes.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Description (optional)</Label>
                    <Input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Context about this relationship..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={adding || !targetId} className="gold-glow">
                    {adding ? "Adding..." : "Add Relationship"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {relations.length === 0 ? (
        <p className="text-sm text-muted-foreground font-lore">No relationships yet.</p>
      ) : (
        <div className="space-y-2">
          {relations.map((rel) => {
            const other = getOtherEntity(rel);
            return (
              <Card key={rel.id} className="grain">
                <CardContent className="flex items-center justify-between py-2">
                  <div
                    className="flex items-center gap-2 cursor-pointer hover:text-gold transition-colors"
                    onClick={() =>
                      router.push(
                        `/campaign/${campaignId}/${ENTITY_ROUTES[other.type] ?? other.type}/${other.id}`
                      )
                    }
                  >
                    <Badge variant="outline" className="text-[10px]">
                      {other.type}
                    </Badge>
                    <span className="text-sm font-medium">{other.name}</span>
                    <ArrowRight className="size-3 text-muted-foreground" />
                    <Badge variant="secondary" className="text-xs">
                      {getRelationLabel(rel.relation_type)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {rel.description && (
                      <span className="text-xs text-muted-foreground italic max-w-[200px] truncate">
                        {rel.description}
                      </span>
                    )}
                    {isGm && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => openEdit(rel)}
                          aria-label="Edit relation"
                        >
                          <Pencil className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleRemove(rel.id)}
                          aria-label="Remove relation"
                        >
                          <X className="size-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <form onSubmit={handleSaveEdit}>
            <DialogHeader>
              <DialogTitle className="font-heading">Edit Relationship</DialogTitle>
              <DialogDescription>
                Update the related entity, relationship type, or description.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Related Entity</Label>
                <Select value={editTargetId} onValueChange={(v) => setEditTargetId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select entity...">
                      {editTargetId ? knownEntities.find((e) => e.id === editTargetId)?.name : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(knownEntities ?? [])
                      .filter((e) => e.id !== entityId)
                      .map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          <span className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px] px-1">
                              {e.entity_type}
                            </Badge>
                            {e.name}
                          </span>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Relationship Type</Label>
                <Select value={editRelationType} onValueChange={(v) => setEditRelationType(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue>{editRelationType ? getRelationLabel(editRelationType) : undefined}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {relationTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Context about this relationship..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={savingEdit || !editTargetId} className="gold-glow">
                {savingEdit ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
