"use client";

import { useState, useEffect, useCallback } from "react";
import { useTransitionRouter } from "@/hooks/use-transition-router";
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
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MasterDetailModal } from "@/components/shared/master-detail-modal";
import { EntityFormTemplate } from "@/components/shared/entity-form-template";
import { GmOnlyBadge } from "@/components/shared/gm-only-badge";
import { VisibilityToggle } from "@/components/shared/visibility-toggle";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { SectionHeader } from "@/components/loomstory/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RelationsPanel } from "@/components/loomstory/relations-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Clock, MessageSquare, Bookmark, ChevronRight, ArrowLeft } from "lucide-react";

interface Npc {
  id: string;
  name: string;
  aliases: string[] | null;
  description: string | null;
  appearance: string | null;
  voice_notes: string | null;
  personality: string | null;
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
  const router = useTransitionRouter();
  const isGm = role === "gm";
  const [npcs, setNpcs] = useState<Npc[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createName, setCreateName] = useState("");
  const [savingCreate, setSavingCreate] = useState(false);

  const fetchNpcs = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from("npcs")
      .select("id, name, aliases, description, appearance, voice_notes, personality, status, tags, portrait_url, gm_notes, player_notes, gm_only")
      .eq("campaign_id", campaignId)
      .is("deleted_at", null);
    if (!isGm) query = query.eq("gm_only", false);
    const { data } = await query.order("name");
    setNpcs(data ?? []);
    setLoading(false);
  }, [campaignId, isGm]);

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
    <>
    <MasterDetailModal<Npc>
      title="NPCs"
      open={open}
      onOpenChange={onOpenChange}
      items={npcs}
      loading={loading}
      onCreateClick={isGm ? () => setCreating(true) : undefined}
      createLabel="New NPC"
      emptyMessage="No NPCs yet. Process a session or create one manually."
      searchPlaceholder="Search NPCs..."
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
        <NpcDetailWithNav
          npc={npc}
          campaignId={campaignId}
          userId={userId}
          role={role}
          onUpdated={fetchNpcs}
        />
      )}
    />

    {/* Create NPC Dialog */}
    <Dialog open={creating} onOpenChange={setCreating}>
      <DialogContent>
        <EntityFormTemplate
          mode="create"
          entityType="NPC"
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
          saving={savingCreate}
          disabled={!createName.trim()}
        >
          <div className="space-y-2">
            <Label htmlFor="create-npc-name">Name</Label>
            <Input
              id="create-npc-name"
              placeholder="Gareth the Bold"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              required
            />
          </div>
        </EntityFormTemplate>
      </DialogContent>
    </Dialog>
    </>
  );
}

// ─── NPC Detail (sidebar content) ──────────────────────────

// ─── Types for lazy-loaded data ──────────────────────────

interface HistoryEvent {
  id: string;
  content: string;
  summary: string | null;
  weight: number;
  event_type: string;
  narrative_day: number | null;
  narrative_time: number | null;
  resolved: boolean;
  created_at: string;
  role: string;
}

interface HistoryConversation {
  id: string;
  title: string;
  turn_count: number;
  created_at: string;
}

interface HistoryMention {
  session_id: string;
  session_title: string;
  session_number: number | null;
  mention_type: string;
  created_at: string;
}

interface HistoryData {
  events: HistoryEvent[];
  conversations: HistoryConversation[];
  session_mentions: HistoryMention[];
}

interface RelationsData {
  relations: Array<{
    id: string;
    source_type: string;
    source_id: string;
    target_type: string;
    target_id: string;
    relation_type: string;
    description: string | null;
    source_name?: string;
    target_name?: string;
  }>;
  relationTypes: Array<{ id: string; label: string }>;
  knownEntities: Array<{ id: string; name: string; entity_type: string }>;
}

function NpcDetail({
  npc: initialNpc,
  campaignId,
  userId,
  role,
  onUpdated,
  onEntityClick,
}: {
  npc: Npc;
  campaignId: string;
  userId: string;
  role: string;
  onUpdated: () => void;
  onEntityClick?: (entityType: string, entityId: string, entityName: string) => void;
}) {
  const isGm = role === "gm";
  const [npc, setNpc] = useState(initialNpc);
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>("general");

  // Lazy-loaded tab data
  const [relationsData, setRelationsData] = useState<RelationsData | null>(null);
  const [relationsLoading, setRelationsLoading] = useState(false);
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Edit form state
  const [name, setName] = useState(npc.name);
  const [aliases, setAliases] = useState((npc.aliases ?? []).join(", "));
  const [description, setDescription] = useState(npc.description ?? "");
  const [appearance, setAppearance] = useState(npc.appearance ?? "");
  const [voiceNotes, setVoiceNotes] = useState(npc.voice_notes ?? "");
  const [personality, setPersonality] = useState(npc.personality ?? "");
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
    setAppearance(initialNpc.appearance ?? "");
    setVoiceNotes(initialNpc.voice_notes ?? "");
    setPersonality(initialNpc.personality ?? "");
    setStatus(initialNpc.status);
    setTags((initialNpc.tags ?? []).join(", "));
    setGmNotes(initialNpc.gm_notes ?? "");
    setPlayerNotes(initialNpc.player_notes ?? "");
    setEditing(false);
    setActiveTab("general");
    setRelationsData(null);
    setHistoryData(null);
  }, [initialNpc]);

  // Lazy fetch relations
  async function fetchRelations() {
    if (relationsData) return;
    setRelationsLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/entities/npc/${npc.id}/relations`);
      if (res.ok) setRelationsData(await res.json());
    } catch {
      toast.error("Failed to load relationships");
    }
    setRelationsLoading(false);
  }

  // Lazy fetch history
  async function fetchHistory() {
    if (historyData) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/entities/npc/${npc.id}/history`);
      if (res.ok) setHistoryData(await res.json());
    } catch {
      toast.error("Failed to load history");
    }
    setHistoryLoading(false);
  }

  function handleTabChange(value: string | null) {
    setActiveTab(value);
    if (value === "relationships") fetchRelations();
    if (value === "history") fetchHistory();
  }

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
        appearance: appearance || null,
        voice_notes: voiceNotes || null,
        personality: personality || null,
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
      .rpc("soft_delete_entity", { p_entity_type: "npc", p_entity_id: npc.id });

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
    setAppearance(npc.appearance ?? "");
    setVoiceNotes(npc.voice_notes ?? "");
    setPersonality(npc.personality ?? "");
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
          <Textarea id="npc-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="npc-appearance">Appearance</Label>
          <Textarea id="npc-appearance" value={appearance} onChange={(e) => setAppearance(e.target.value)} rows={2} placeholder="Physical appearance, clothing, distinguishing features..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="npc-voice">Voice & Mannerisms</Label>
          <Textarea id="npc-voice" value={voiceNotes} onChange={(e) => setVoiceNotes(e.target.value)} rows={2} placeholder="Accent, pace, verbal tics, body language..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="npc-personality">Personality</Label>
          <Textarea id="npc-personality" value={personality} onChange={(e) => setPersonality(e.target.value)} rows={2} placeholder="Temperament, motivations, quirks..." />
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
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline" className="text-xs">{npc.status}</Badge>
            {npc.tags && npc.tags.length > 0 &&
              npc.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))
            }
            {npc.gm_only && <GmOnlyBadge />}
            {npc.aliases && npc.aliases.length > 0 && (
              <span className="text-xs text-muted-foreground italic">
                aka {npc.aliases.join(", ")}
              </span>
            )}
          </div>
        </div>
        {isGm && (
          <VisibilityToggle gmOnly={npc.gm_only} onToggle={handleToggleVisibility} loading={togglingVisibility} />
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList variant="line">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* ─── General Tab ─── */}
        <TabsContent value="general">
          <div className="space-y-4 pt-2">
            {npc.description && (
              <>
                <SectionHeader>Description</SectionHeader>
                <Card className="grain">
                  <CardContent className="py-3">
                    <p className="text-sm font-lore">{npc.description}</p>
                  </CardContent>
                </Card>
              </>
            )}

            {npc.appearance && (
              <>
                <SectionHeader>Appearance</SectionHeader>
                <Card className="grain">
                  <CardContent className="py-3">
                    <p className="text-sm">{npc.appearance}</p>
                  </CardContent>
                </Card>
              </>
            )}

            {npc.voice_notes && (
              <>
                <SectionHeader>Voice & Mannerisms</SectionHeader>
                <Card className="grain">
                  <CardContent className="py-3">
                    <p className="text-sm">{npc.voice_notes}</p>
                  </CardContent>
                </Card>
              </>
            )}

            {npc.personality && (
              <>
                <SectionHeader>Personality</SectionHeader>
                <Card className="grain">
                  <CardContent className="py-3">
                    <p className="text-sm">{npc.personality}</p>
                  </CardContent>
                </Card>
              </>
            )}

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

            {isGm && (
              <div className="pt-2">
                <Button variant="outline" onClick={() => setEditing(true)}>
                  <Pencil className="size-4 mr-1.5" />
                  Edit
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ─── Relationships Tab ─── */}
        <TabsContent value="relationships">
          <div className="pt-2">
            {relationsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : relationsData ? (
              <RelationsPanel
                campaignId={campaignId}
                entityType="npc"
                entityId={npc.id}
                entityName={npc.name}
                relations={relationsData.relations}
                relationTypes={relationsData.relationTypes}
                knownEntities={relationsData.knownEntities}
                role={role}
                userId={userId}
                onEntityClick={onEntityClick}
              />
            ) : (
              <p className="text-sm text-muted-foreground font-lore">No relationships yet.</p>
            )}
          </div>
        </TabsContent>

        {/* ─── History Tab ─── */}
        <TabsContent value="history">
          <div className="pt-2">
            {historyLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : historyData ? (
              <NpcHistory data={historyData} />
            ) : (
              <p className="text-sm text-muted-foreground font-lore">No history yet.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── History sub-component ───────────────────────────────

function NpcHistory({ data }: { data: HistoryData }) {
  const { events, conversations, session_mentions } = data;
  const hasContent = events.length > 0 || conversations.length > 0 || session_mentions.length > 0;

  if (!hasContent) {
    return <p className="text-sm text-muted-foreground font-lore">No history yet.</p>;
  }

  return (
    <div className="space-y-5">
      {/* Events */}
      {events.length > 0 && (
        <div>
          <SectionHeader className="flex items-center gap-2 mb-2">
            <Bookmark className="size-3.5 text-gold" />
            Events ({events.length})
          </SectionHeader>
          <div className="space-y-2">
            {events.map((evt) => (
              <Card key={evt.id} className="grain">
                <CardContent className="py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2">
                        {evt.summary ?? evt.content}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px]">{evt.event_type}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{evt.role}</Badge>
                        {evt.narrative_day != null && (
                          <span className="text-[10px] text-muted-foreground">
                            Day {evt.narrative_day}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Conversations */}
      {conversations.length > 0 && (
        <div>
          <SectionHeader className="flex items-center gap-2 mb-2">
            <MessageSquare className="size-3.5 text-gold" />
            Conversations ({conversations.length})
          </SectionHeader>
          <div className="space-y-2">
            {conversations.map((conv) => (
              <Card key={conv.id} className="grain">
                <CardContent className="py-2 flex items-center justify-between">
                  <span className="text-sm font-medium">{conv.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {conv.turn_count} turn{conv.turn_count !== 1 ? "s" : ""}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Session Mentions */}
      {session_mentions.length > 0 && (
        <div>
          <SectionHeader className="flex items-center gap-2 mb-2">
            <Clock className="size-3.5 text-gold" />
            Session Appearances ({session_mentions.length})
          </SectionHeader>
          <div className="space-y-2">
            {session_mentions.map((m) => (
              <Card key={`${m.session_id}-${m.mention_type}`} className="grain">
                <CardContent className="py-2 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {m.session_number != null && (
                      <span className="font-mono text-xs text-muted-foreground mr-1.5">
                        #{m.session_number}
                      </span>
                    )}
                    {m.session_title}
                  </span>
                  <Badge variant="outline" className="text-[10px]">{m.mention_type}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Navigation wrapper (breadcrumb + page-flip) ─────────

const ENTITY_TABLES: Record<string, string> = {
  npc: "npcs",
  location: "locations",
  faction: "factions",
  item: "items",
  character: "characters",
};

interface NavEntry {
  entityType: string;
  entityId: string;
  entityName: string;
}

function NpcDetailWithNav({
  npc,
  campaignId,
  userId,
  role,
  onUpdated,
}: {
  npc: Npc;
  campaignId: string;
  userId: string;
  role: string;
  onUpdated: () => void;
}) {
  const [navStack, setNavStack] = useState<NavEntry[]>([]);
  const [deepDiveEntity, setDeepDiveEntity] = useState<{ type: string; id: string; name: string; data: Record<string, unknown> } | null>(null);
  const [loadingEntity, setLoadingEntity] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("left");

  // Reset nav when the parent NPC selection changes
  useEffect(() => {
    setNavStack([]);
    setDeepDiveEntity(null);
  }, [npc.id]);

  async function handleEntityClick(entityType: string, entityId: string, entityName: string) {
    setSlideDirection("left");
    setLoadingEntity(true);

    // Push current entity onto stack
    if (deepDiveEntity) {
      setNavStack((prev) => [...prev, { entityType: deepDiveEntity.type, entityId: deepDiveEntity.id, entityName: deepDiveEntity.name }]);
    } else {
      setNavStack((prev) => [...prev, { entityType: "npc", entityId: npc.id, entityName: npc.name }]);
    }

    // Fetch the target entity
    const table = ENTITY_TABLES[entityType];
    if (table) {
      const supabase = createClient();
      const { data } = await supabase.from(table).select("*").eq("id", entityId).single();
      if (data) {
        setDeepDiveEntity({ type: entityType, id: entityId, name: entityName, data });
      }
    }
    setLoadingEntity(false);
  }

  function handleBreadcrumbClick(index: number) {
    setSlideDirection("right");
    const entry = navStack[index];
    // Pop stack to this point
    setNavStack((prev) => prev.slice(0, index));

    if (entry.entityType === "npc" && entry.entityId === npc.id) {
      // Going back to the original NPC
      setDeepDiveEntity(null);
    } else {
      // Re-fetch the entity
      const table = ENTITY_TABLES[entry.entityType];
      if (table) {
        setLoadingEntity(true);
        const supabase = createClient();
        supabase.from(table).select("*").eq("id", entry.entityId).single().then(({ data }) => {
          if (data) {
            setDeepDiveEntity({ type: entry.entityType, id: entry.entityId, name: entry.entityName, data });
          }
          setLoadingEntity(false);
        });
      }
    }
  }

  function handleBack() {
    if (navStack.length === 0) return;
    handleBreadcrumbClick(navStack.length - 1);
  }

  const currentName = deepDiveEntity?.name ?? npc.name;
  const currentId = deepDiveEntity?.id ?? npc.id;

  return (
    <div>
      {/* Breadcrumb trail */}
      {navStack.length > 0 && (
        <div className="flex items-center gap-1 mb-4 text-sm flex-wrap" data-testid="breadcrumb-trail">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleBack}
            aria-label="Go back"
          >
            <ArrowLeft className="size-4" />
          </Button>
          {navStack.map((entry, i) => (
            <span key={`${entry.entityId}-${i}`} className="flex items-center gap-1">
              <button
                className="text-muted-foreground hover:text-gold transition-colors cursor-pointer"
                onClick={() => handleBreadcrumbClick(i)}
              >
                {entry.entityName}
              </button>
              <ChevronRight className="size-3 text-muted-foreground" />
            </span>
          ))}
          <span className="text-foreground font-medium">{currentName}</span>
        </div>
      )}

      {/* Animated content */}
      {loadingEntity ? (
        <div className="space-y-3 pt-2">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div
          key={currentId}
          className={slideDirection === "left" ? "animate-slide-in-right" : "animate-slide-in-left"}
        >
          {deepDiveEntity ? (
            <EntityDeepDiveDetail
              entityType={deepDiveEntity.type}
              entityData={deepDiveEntity.data}
              campaignId={campaignId}
              userId={userId}
              role={role}
              onEntityClick={handleEntityClick}
            />
          ) : (
            <NpcDetail
              npc={npc}
              campaignId={campaignId}
              userId={userId}
              role={role}
              onUpdated={onUpdated}
              onEntityClick={handleEntityClick}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Generic deep-dive detail (read-only, for non-NPC entities) ──

const ENTITY_TYPE_LABELS: Record<string, string> = {
  npc: "NPC",
  location: "Location",
  faction: "Faction",
  item: "Item",
  character: "Character",
};

function EntityDeepDiveDetail({
  entityType,
  entityData,
  campaignId,
  userId,
  role,
  onEntityClick,
}: {
  entityType: string;
  entityData: Record<string, unknown>;
  campaignId: string;
  userId: string;
  role: string;
  onEntityClick: (entityType: string, entityId: string, entityName: string) => void;
}) {
  const isGm = role === "gm";
  const entityId = entityData.id as string;
  const entityName = (entityData.name as string) ?? "Unknown";
  const [activeTab, setActiveTab] = useState<string | null>("general");

  // Lazy-loaded relations
  const [relationsData, setRelationsData] = useState<RelationsData | null>(null);
  const [relationsLoading, setRelationsLoading] = useState(false);

  // Lazy-loaded history
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  async function fetchRelations() {
    if (relationsData) return;
    setRelationsLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/entities/${entityType}/${entityId}/relations`);
      if (res.ok) setRelationsData(await res.json());
    } catch {
      toast.error("Failed to load relationships");
    }
    setRelationsLoading(false);
  }

  async function fetchHistory() {
    if (historyData) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/entities/${entityType}/${entityId}/history`);
      if (res.ok) setHistoryData(await res.json());
    } catch {
      toast.error("Failed to load history");
    }
    setHistoryLoading(false);
  }

  function handleTabChange(value: string | null) {
    setActiveTab(value);
    if (value === "relationships") fetchRelations();
    if (value === "history") fetchHistory();
  }

  // Extract common fields
  const description = entityData.description as string | null;
  const gmNotes = entityData.gm_notes as string | null;
  const playerNotes = entityData.player_notes as string | null;
  const gmOnly = entityData.gm_only as boolean | undefined;
  const aliases = entityData.aliases as string[] | null;
  const status = entityData.status as string | null;
  const goals = entityData.goals as string | null;
  const appearance = entityData.appearance as string | null;
  const type = entityData.type as string | null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            {ENTITY_TYPE_LABELS[entityType] ?? entityType}
          </Badge>
          {gmOnly && <GmOnlyBadge />}
        </div>
        <h3 className="text-xl font-heading font-semibold mt-1">{entityName}</h3>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {status && <Badge variant="outline" className="text-xs">{status}</Badge>}
          {type && <Badge variant="secondary" className="text-xs">{type}</Badge>}
          {aliases && aliases.length > 0 && (
            <span className="text-xs text-muted-foreground italic">
              aka {aliases.join(", ")}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList variant="line">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="space-y-4 pt-2">
            {description && (
              <>
                <SectionHeader>Description</SectionHeader>
                <Card className="grain">
                  <CardContent className="py-3">
                    <p className="text-sm font-lore">{description}</p>
                  </CardContent>
                </Card>
              </>
            )}

            {appearance && (
              <>
                <SectionHeader>Appearance</SectionHeader>
                <Card className="grain">
                  <CardContent className="py-3">
                    <p className="text-sm">{appearance}</p>
                  </CardContent>
                </Card>
              </>
            )}

            {goals && (
              <>
                <SectionHeader>Goals</SectionHeader>
                <Card className="grain">
                  <CardContent className="py-3">
                    <p className="text-sm">{goals}</p>
                  </CardContent>
                </Card>
              </>
            )}

            {isGm && gmNotes && (
              <>
                <Separator />
                <SectionHeader>GM Notes</SectionHeader>
                <Card className="grain">
                  <CardContent className="py-3">
                    <p className="text-sm italic">{gmNotes}</p>
                  </CardContent>
                </Card>
              </>
            )}

            {playerNotes && (
              <>
                <Separator />
                <SectionHeader>Player Notes</SectionHeader>
                <Card className="grain">
                  <CardContent className="py-3">
                    <p className="text-sm">{playerNotes}</p>
                  </CardContent>
                </Card>
              </>
            )}

            {!description && !gmNotes && !playerNotes && !goals && !appearance && (
              <p className="text-sm text-muted-foreground font-lore">No details available.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="relationships">
          <div className="pt-2">
            {relationsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : relationsData ? (
              <RelationsPanel
                campaignId={campaignId}
                entityType={entityType}
                entityId={entityId}
                entityName={entityName}
                relations={relationsData.relations}
                relationTypes={relationsData.relationTypes}
                knownEntities={relationsData.knownEntities}
                role={role}
                userId={userId}
                onEntityClick={onEntityClick}
              />
            ) : (
              <p className="text-sm text-muted-foreground font-lore">No relationships yet.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="pt-2">
            {historyLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : historyData ? (
              <NpcHistory data={historyData} />
            ) : (
              <p className="text-sm text-muted-foreground font-lore">No history yet.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
