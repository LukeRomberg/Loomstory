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
import { TiptapEditor } from "@/components/loomstory/tiptap-editor";
import { ExtractionReview } from "@/components/loomstory/extraction-review";
import { SessionPanels } from "./session-panels";
import {
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
  session: Session;
  role: string;
  userId: string;
  onDeleted?: () => void;
}

export function SessionDetail({
  campaignId,
  session: initialSession,
  role,
  userId,
  onDeleted,
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

  const loadExtractions = useCallback(async () => {
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
  }, [session.id]);

  // Load existing extractions if session is processed
  useEffect(() => {
    if (session.status === "processed" || session.status === "processing") {
      loadExtractions();
    }
  }, [session.id, session.status, loadExtractions]);

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
    const { error } = await supabase.rpc("soft_delete_entity", {
      p_entity_type: "session",
      p_entity_id: session.id,
    });

    if (error) {
      toast.error("Failed to delete", { description: error.message });
      setDeleting(false);
      return;
    }
    toast.success("Session archived");
    setDeleteOpen(false);
    setDeleting(false);
    onDeleted?.();
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

  const headerBlock = (
    <SessionHeader
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
  );

  // ─── Render: Extraction Review Mode ─────────────────────
  if (extractionData && isGm) {
    return (
      <div className="scrollbar-none flex h-full flex-col gap-4 overflow-y-auto pr-1 text-leather">
        {headerBlock}
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
    <div className="scrollbar-none flex h-full flex-col gap-4 overflow-y-auto pr-1 text-leather">
      {headerBlock}

      {isGm && (
        <BookCard>
          <BookCardHeader className="flex flex-row items-center justify-between gap-2">
            <BookCardTitle>Session Notes</BookCardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleSaveNotes}
                disabled={saving}
                variant="outline"
                className="border-leather/40 bg-transparent text-leather hover:bg-leather/10 hover:text-leather"
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
          </BookCardHeader>
          <BookCardContent>
            <TiptapEditor
              content={notes}
              onChange={handleNotesChange}
              placeholder="Write your session notes here... What happened? Who did the party meet? What decisions were made?"
            />
          </BookCardContent>
        </BookCard>
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
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        {editingMeta ? (
          <form onSubmit={onSaveMeta} className="space-y-3 [&_label]:text-leather">
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
              <Button type="submit" size="sm" disabled={saving} className="gold-glow">
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onResetMeta}
                className="text-leather hover:bg-leather/10 hover:text-leather"
              >
                <X className="size-4" />
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex items-center gap-3">
            <h2 className="font-heading text-lg font-semibold uppercase tracking-[0.12em] text-leather sm:text-xl">
              {session.session_number != null && (
                <span className="mr-2 text-leather/65">
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
                className="text-leather hover:bg-leather/10 hover:text-leather"
              >
                <Pencil className="size-3.5" />
              </Button>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          <Badge
            variant="outline"
            className="border-leather/40 bg-leather/10 text-[11px] font-semibold text-leather"
          >
            {session.status}
          </Badge>
          {session.date_played && (
            <span className="text-xs text-leather/70">
              Played {new Date(session.date_played).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {isGm && (
        <div className="flex shrink-0 items-center gap-1 text-leather">
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
