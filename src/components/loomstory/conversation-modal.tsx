"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MasterDetailModal } from "@/components/shared/master-detail-modal";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { GmOnlyBadge } from "@/components/shared/gm-only-badge";
import { VisibilityToggle } from "@/components/shared/visibility-toggle";
import { SectionHeader } from "@/components/loomstory/section-header";
import { ConversationCreate } from "@/app/(protected)/campaign/[id]/conversations/conversation-create";
import { Pencil } from "lucide-react";

interface Turn {
  speaker: string;
  text: string;
  tone: string;
}

interface Participant {
  entity_id: string | null;
  entity_type: string;
  name: string;
}

interface Conversation {
  id: string;
  session_id: string | null;
  event_id: string | null;
  title: string | null;
  participants: Participant[];
  content: Turn[];
  content_plain: string | null;
  gm_notes: string | null;
  gm_only: boolean;
  created_at: string;
}

interface Session {
  id: string;
  title: string;
  session_number: number | null;
}

interface KnownEntity {
  id: string;
  name: string;
  entity_type: string;
}

interface ConversationModalProps {
  campaignId: string;
  userId: string;
  role: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConversationModal({
  campaignId,
  userId,
  role,
  open,
  onOpenChange,
}: ConversationModalProps) {
  const isGm = role === "gm";
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [knownEntities, setKnownEntities] = useState<KnownEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sessionFilter, setSessionFilter] = useState<string>("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let convsQuery = supabase
      .from("conversation_logs")
      .select("id, session_id, event_id, title, participants, content, content_plain, gm_notes, gm_only, created_at")
      .eq("campaign_id", campaignId)
      .is("deleted_at", null);
    if (!isGm) convsQuery = convsQuery.eq("gm_only", false);
    const [convsRes, sessionsRes, npcsRes, charsRes] = await Promise.all([
      convsQuery.order("created_at", { ascending: false }),
      supabase
        .from("sessions")
        .select("id, title, session_number")
        .eq("campaign_id", campaignId)
        .is("deleted_at", null)
        .order("session_number", { ascending: true }),
      supabase
        .from("npcs")
        .select("id, name")
        .eq("campaign_id", campaignId)
        .is("deleted_at", null)
        .order("name"),
      supabase
        .from("characters")
        .select("id, name")
        .eq("campaign_id", campaignId)
        .is("deleted_at", null)
        .order("name"),
    ]);
    setConversations(convsRes.data ?? []);
    setSessions(sessionsRes.data ?? []);
    setKnownEntities([
      ...(npcsRes.data ?? []).map((n) => ({ id: n.id, name: n.name, entity_type: "npc" })),
      ...(charsRes.data ?? []).map((c) => ({ id: c.id, name: c.name, entity_type: "character" })),
    ]);
    setLoading(false);
  }, [campaignId, isGm]);

  useEffect(() => {
    if (open) fetchData();
  }, [open, fetchData]);

  const filtered = useMemo(() => {
    if (sessionFilter === "all") return conversations;
    return conversations.filter((c) => c.session_id === sessionFilter);
  }, [conversations, sessionFilter]);

  return (
    <>
      <MasterDetailModal<Conversation>
        title="Conversations"
        open={open}
        onOpenChange={onOpenChange}
        items={filtered}
        loading={loading}
        onCreateClick={isGm ? () => setCreating(true) : undefined}
        createLabel="New Conversation"
        emptyMessage="No conversations yet. Process a session to extract dialogues."
        searchPlaceholder="Search conversations..."
        renderFilters={() => (
          <Select value={sessionFilter} onValueChange={(v) => setSessionFilter(v ?? "all")}>
            <SelectTrigger className="w-[200px]">
              <SelectValue>
                {sessionFilter === "all" ? "All Sessions" : sessions.find((s) => s.id === sessionFilter)?.title ?? "Unknown"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sessions</SelectItem>
              {sessions.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        renderListItem={(conv, isSelected) => (
          <div>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${isSelected ? "text-gold" : ""}`}>
                {conv.title ?? "Untitled conversation"}
              </span>
              {conv.gm_only && <GmOnlyBadge />}
            </div>
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              {conv.participants.map((p, i) => (
                <Badge key={i} variant="outline" className="text-[10px]">{p.name}</Badge>
              ))}
            </div>
            {conv.content && conv.content.length > 0 && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                {conv.content[0].speaker}: {conv.content[0].text}
              </p>
            )}
          </div>
        )}
        renderDetail={(conv) => (
          <ConversationDetailPanel
            conversation={conv}
            campaignId={campaignId}
            role={role}
            onUpdated={fetchData}
          />
        )}
      />

      {isGm && (
        <ConversationCreate
          campaignId={campaignId}
          userId={userId}
          knownEntities={knownEntities}
          open={creating}
          onOpenChange={setCreating}
          onCreated={fetchData}
        />
      )}
    </>
  );
}

// ─── Conversation Detail Panel ──────────────────────────

function ConversationDetailPanel({
  conversation: initial,
  campaignId,
  role,
  onUpdated,
}: {
  conversation: Conversation;
  campaignId: string;
  role: string;
  onUpdated: () => void;
}) {
  const isGm = role === "gm";
  const [conv, setConv] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState(false);

  // Edit state
  const [title, setTitle] = useState(conv.title ?? "");
  const [gmNotes, setGmNotes] = useState(conv.gm_notes ?? "");

  useEffect(() => {
    setConv(initial);
    setTitle(initial.title ?? "");
    setGmNotes(initial.gm_notes ?? "");
    setEditing(false);
  }, [initial]);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("conversation_logs")
      .update({
        title: title || null,
        gm_notes: gmNotes || null,
      })
      .eq("id", conv.id);

    if (error) {
      toast.error("Failed to save", { description: error.message });
    } else {
      setConv((prev) => ({ ...prev, title: title || null, gm_notes: gmNotes || null }));
      setEditing(false);
      toast.success("Conversation updated");
      onUpdated();
    }
    setSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase
      .rpc("soft_delete_entity", { p_entity_type: "conversation", p_entity_id: conv.id });

    if (error) {
      toast.error("Failed to delete", { description: error.message });
      setDeleting(false);
      return;
    }
    toast.success("Conversation archived");
    setDeleteOpen(false);
    setDeleting(false);
    onUpdated();
  }

  async function handleToggleVisibility() {
    setTogglingVisibility(true);
    const supabase = createClient();
    const newValue = !conv.gm_only;
    const { error } = await supabase
      .from("conversation_logs")
      .update({ gm_only: newValue })
      .eq("id", conv.id);

    if (error) {
      toast.error("Failed to update visibility", { description: error.message });
    } else {
      setConv((prev) => ({ ...prev, gm_only: newValue }));
      toast.success(newValue ? "Hidden from players" : "Visible to players");
      onUpdated();
    }
    setTogglingVisibility(false);
  }

  const turns = conv.content ?? [];

  if (editing && isGm) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-heading font-semibold">Edit Conversation</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-conv-title">Title</Label>
            <Input id="edit-conv-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-conv-gm">GM Notes</Label>
            <Textarea id="edit-conv-gm" value={gmNotes} onChange={(e) => setGmNotes(e.target.value)} rows={3} placeholder="Hidden notes..." />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} className="gold-glow">{saving ? "Saving..." : "Save"}</Button>
            <Button variant="ghost" onClick={() => { setEditing(false); setTitle(conv.title ?? ""); setGmNotes(conv.gm_notes ?? ""); }}>Cancel</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-heading font-semibold">
            {conv.title ?? "Untitled conversation"}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {conv.participants.map((p, i) => (
              <Badge key={i} variant="outline" className="text-xs">{p.name}</Badge>
            ))}
            {conv.gm_only && <GmOnlyBadge />}
          </div>
        </div>
        {isGm && (
          <VisibilityToggle gmOnly={conv.gm_only} onToggle={handleToggleVisibility} loading={togglingVisibility} />
        )}
      </div>

      {/* Dialogue */}
      <Card className="grain">
        <CardContent className="py-4">
          <div className="space-y-2 border-l-2 border-gold/30 pl-3">
            {turns.map((turn, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">{turn.tone}</Badge>
                <p>
                  <span className="font-medium text-foreground">{turn.speaker}:</span>{" "}
                  <span className="text-muted-foreground">{turn.text}</span>
                </p>
              </div>
            ))}
            {turns.length === 0 && (
              <p className="text-sm text-muted-foreground italic">No dialogue recorded.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* GM Notes */}
      {isGm && conv.gm_notes && (
        <>
          <SectionHeader>GM Notes</SectionHeader>
          <Card className="grain">
            <CardContent className="py-3">
              <p className="text-sm italic text-muted-foreground">{conv.gm_notes}</p>
            </CardContent>
          </Card>
        </>
      )}

      {/* Actions */}
      {isGm && (
        <div className="flex items-center gap-2 pt-2">
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="size-4 mr-1.5" />
            Edit
          </Button>
          <Button variant="ghost" size="sm" className="text-red-400" onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        </div>
      )}

      <ConfirmDeleteDialog
        entityName={conv.title ?? "this conversation"}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </div>
  );
}
