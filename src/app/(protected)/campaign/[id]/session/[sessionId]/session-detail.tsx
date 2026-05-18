"use client";

import { useState, useCallback, useEffect } from "react";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TiptapEditor } from "@/components/loomstory/tiptap-editor";
import { ExtractionReview } from "@/components/loomstory/extraction-review";
import { SessionPanels } from "./session-panels";
import {
  ChevronLeft,
  Save,
  Trash2,
  Pencil,
  X,
  Sparkles,
  Loader2,
} from "lucide-react";

interface Session {
  id: string;
  title: string;
  date_played: string | null;
  session_number: number | null;
  raw_notes: string | null;
  ai_summary: string | null;
  gm_notes: string | null;
  player_summary: string | null;
  player_visible: boolean;
  status: string;
  created_by: string;
}

interface SessionDetailProps {
  campaignId: string;
  campaignName: string;
  session: Session;
  role: string;
  userId: string;
}

export function SessionDetail({
  campaignId,
  campaignName,
  session: initialSession,
  role,
  userId,
}: SessionDetailProps) {
  const router = useTransitionRouter();
  const isGm = role === "gm";

  const [session, setSession] = useState(initialSession);
  const [editingMeta, setEditingMeta] = useState(false);
  const [title, setTitle] = useState(session.title);
  const [datePlayed, setDatePlayed] = useState(session.date_played ?? "");
  const [sessionNumber, setSessionNumber] = useState(
    session.session_number?.toString() ?? ""
  );
  const [notes, setNotes] = useState(session.raw_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [extractionData, setExtractionData] = useState<{
    entities: Record<string, unknown>;
    events: Record<string, unknown>;
    conversations: Record<string, unknown>;
  } | null>(null);

  // Load existing extractions if session is processed
  useEffect(() => {
    if (session.status === "processed" || session.status === "processing") {
      loadExtractions();
    }
  }, [session.id, session.status]);

  async function loadExtractions() {
    try {
      const res = await fetch(`/api/session-process/${session.id}`);
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        const entities =
          data.find((d: { pass_type: string }) => d.pass_type === "entities")
            ?.extraction ?? {};
        const events =
          data.find((d: { pass_type: string }) => d.pass_type === "events")
            ?.extraction ?? {};
        const conversations =
          data.find(
            (d: { pass_type: string }) => d.pass_type === "conversations"
          )?.extraction ?? {};

        setExtractionData({ entities, events, conversations });
      }
    } catch {
      // Extractions might not exist yet
    }
  }

  const handleNotesChange = useCallback((html: string) => {
    setNotes(html);
  }, []);

  async function handleSaveNotes() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("sessions")
      .update({ raw_notes: notes })
      .eq("id", session.id);

    if (error) {
      toast.error("Failed to save notes", { description: error.message });
    } else {
      setSession((prev) => ({ ...prev, raw_notes: notes }));
      toast.success("Notes saved");
    }
    setSaving(false);
  }

  async function handleProcess() {
    // Save notes first
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("sessions")
      .update({ raw_notes: notes })
      .eq("id", session.id);
    setSaving(false);

    setProcessing(true);
    setExtractionData(null);
    setSession((prev) => ({ ...prev, status: "processing" }));

    const toastId = toast.loading("Processing session notes with AI...", {
      description:
        "Running 3-pass extraction (entities, events, conversations)",
    });

    try {
      const res = await fetch("/api/session-process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: campaignId,
          session_id: session.id,
          user_id: userId,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error("Processing failed", {
          id: toastId,
          description: result.error,
        });
        setSession((prev) => ({ ...prev, status: "draft" }));
        setProcessing(false);
        return;
      }

      toast.success("Extraction complete", {
        id: toastId,
        description: `${result.summary.npcs} entities · ${result.summary.events} events · ${result.summary.conversations} conversations`,
      });

      setSession((prev) => ({ ...prev, status: "processed" }));
      await loadExtractions();
    } catch {
      toast.error("Processing failed", {
        id: toastId,
        description: "An unexpected error occurred",
      });
      setSession((prev) => ({ ...prev, status: "draft" }));
    }

    setProcessing(false);
  }

  async function handleSaveMeta(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("sessions")
      .update({
        title,
        date_played: datePlayed || null,
        session_number: sessionNumber ? parseInt(sessionNumber) : null,
      })
      .eq("id", session.id);

    if (error) {
      toast.error("Failed to save", { description: error.message });
    } else {
      setSession((prev) => ({
        ...prev,
        title,
        date_played: datePlayed || null,
        session_number: sessionNumber ? parseInt(sessionNumber) : null,
      }));
      setEditingMeta(false);
      toast.success("Session updated");
    }
    setSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase
      .rpc("soft_delete_entity", { p_entity_type: "session", p_entity_id: session.id });

    if (error) {
      toast.error("Failed to delete", { description: error.message });
      setDeleting(false);
      return;
    }

    toast.success("Session archived");
    router.push(`/campaign/${campaignId}/sessions`);
    router.refresh();
  }

  function handleCommitted() {
    setExtractionData(null);
    router.refresh();
  }

  function handleBackToNotes() {
    setExtractionData(null);
    setSession((prev) => ({ ...prev, status: "draft" }));
  }

  // ─── Render: Extraction Review Mode ─────────────────────
  if (extractionData && isGm) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <SessionHeader
          campaignId={campaignId}
          campaignName={campaignName}
          session={session}
          isGm={isGm}
          editingMeta={editingMeta}
          setEditingMeta={setEditingMeta}
          title={title}
          setTitle={setTitle}
          datePlayed={datePlayed}
          setDatePlayed={setDatePlayed}
          sessionNumber={sessionNumber}
          setSessionNumber={setSessionNumber}
          saving={saving}
          onSaveMeta={handleSaveMeta}
          deleteOpen={deleteOpen}
          setDeleteOpen={setDeleteOpen}
          deleting={deleting}
          onDelete={handleDelete}
          onResetMeta={() => {
            setEditingMeta(false);
            setTitle(session.title);
            setDatePlayed(session.date_played ?? "");
            setSessionNumber(session.session_number?.toString() ?? "");
          }}
        />

        <ExtractionReview
          sessionId={session.id}
          campaignId={campaignId}
          userId={userId}
          data={extractionData}
          onCommitted={handleCommitted}
          onBackToNotes={handleBackToNotes}
        />
      </div>
    );
  }

  // ─── Render: Notes Mode ─────────────────────────────────
  return (
    <div className="space-y-6">
      <SessionHeader
        campaignId={campaignId}
        campaignName={campaignName}
        session={session}
        isGm={isGm}
        editingMeta={editingMeta}
        setEditingMeta={setEditingMeta}
        title={title}
        setTitle={setTitle}
        datePlayed={datePlayed}
        setDatePlayed={setDatePlayed}
        sessionNumber={sessionNumber}
        setSessionNumber={setSessionNumber}
        saving={saving}
        onSaveMeta={handleSaveMeta}
        deleteOpen={deleteOpen}
        setDeleteOpen={setDeleteOpen}
        deleting={deleting}
        onDelete={handleDelete}
        onResetMeta={() => {
          setEditingMeta(false);
          setTitle(session.title);
          setDatePlayed(session.date_played ?? "");
          setSessionNumber(session.session_number?.toString() ?? "");
        }}
      />

      {isGm && (
        <Card className="grain">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading">Session Notes</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleSaveNotes}
                disabled={saving}
              >
                <Save className="size-4 mr-1.5" />
                {saving ? "Saving..." : "Save Notes"}
              </Button>
              <Button
                size="sm"
                className="gold-glow font-heading"
                onClick={handleProcess}
                disabled={processing || !notes || notes === "<p></p>"}
              >
                {processing ? (
                  <>
                    <Loader2 className="size-4 mr-1.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4 mr-1.5" />
                    Process Session
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <TiptapEditor
              content={notes}
              onChange={handleNotesChange}
              placeholder="Write your session notes here... What happened? Who did the party meet? What decisions were made?"
            />
          </CardContent>
        </Card>
      )}

      <SessionPanels
        sessionId={session.id}
        aiSummary={session.ai_summary}
        gmNotes={session.gm_notes}
        playerVisible={session.player_visible}
        status={session.status}
        role={role}
      />
    </div>
  );
}

// ─── Session Header (shared between modes) ────────────────

function SessionHeader({
  campaignId,
  campaignName,
  session,
  isGm,
  editingMeta,
  setEditingMeta,
  title,
  setTitle,
  datePlayed,
  setDatePlayed,
  sessionNumber,
  setSessionNumber,
  saving,
  onSaveMeta,
  deleteOpen,
  setDeleteOpen,
  deleting,
  onDelete,
  onResetMeta,
}: {
  campaignId: string;
  campaignName: string;
  session: Session;
  isGm: boolean;
  editingMeta: boolean;
  setEditingMeta: (v: boolean) => void;
  title: string;
  setTitle: (v: string) => void;
  datePlayed: string;
  setDatePlayed: (v: string) => void;
  sessionNumber: string;
  setSessionNumber: (v: string) => void;
  saving: boolean;
  onSaveMeta: (e: React.FormEvent) => void;
  deleteOpen: boolean;
  setDeleteOpen: (v: boolean) => void;
  deleting: boolean;
  onDelete: () => void;
  onResetMeta: () => void;
}) {
  const router = useTransitionRouter();

  return (
    <div className="flex items-start justify-between">
      <div>
        <button
          onClick={() => router.push(`/campaign/${campaignId}/sessions`)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
        >
          <ChevronLeft className="size-4" />
          {campaignName} — Sessions
        </button>

        {editingMeta ? (
          <form onSubmit={onSaveMeta} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-number">Session #</Label>
                <Input
                  id="edit-number"
                  type="number"
                  value={sessionNumber}
                  onChange={(e) => setSessionNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date Played</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={datePlayed}
                  onChange={(e) => setDatePlayed(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onResetMeta}
              >
                <X className="size-4" />
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-heading font-semibold">
              {session.session_number != null && (
                <span className="text-muted-foreground mr-2">
                  #{session.session_number}
                </span>
              )}
              {session.title}
            </h2>
            {isGm && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setEditingMeta(true)}
              >
                <Pencil className="size-3.5" />
              </Button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 mt-1">
          <Badge
            variant={
              session.status === "published" ? "default" : "secondary"
            }
            className="text-xs"
          >
            {session.status}
          </Badge>
          {session.date_played && (
            <span className="text-xs text-muted-foreground">
              Played{" "}
              {new Date(session.date_played).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {isGm && (
        <div className="flex items-center gap-2">
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger
              render={
                <Button variant="ghost" size="icon">
                  <Trash2 className="size-4 text-red-400" />
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Delete &quot;{session.title}&quot;?
                </DialogTitle>
                <DialogDescription>
                  This will archive the session. All data is preserved and
                  can be recovered later.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setDeleteOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={onDelete}
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
  );
}
