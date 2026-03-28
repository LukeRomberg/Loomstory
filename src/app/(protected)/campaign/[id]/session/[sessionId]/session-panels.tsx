"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SectionHeader } from "@/components/loomstory/section-header";
import { Pencil, Save, X, Eye, EyeOff, Send } from "lucide-react";

interface SessionPanelsProps {
  sessionId: string;
  aiSummary: string | null;
  gmNotes: string | null;
  playerVisible: boolean;
  status: string;
  role: string;
}

export function SessionPanels({
  sessionId,
  aiSummary: initialSummary,
  gmNotes: initialGmNotes,
  playerVisible: initialPlayerVisible,
  status: initialStatus,
  role,
}: SessionPanelsProps) {
  const isGm = role === "gm";

  const [aiSummary, setAiSummary] = useState(initialSummary);
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState(initialSummary ?? "");
  const [savingSummary, setSavingSummary] = useState(false);

  const [gmNotes, setGmNotes] = useState(initialGmNotes);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(initialGmNotes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);

  const [playerVisible, setPlayerVisible] = useState(initialPlayerVisible);
  const [status, setStatus] = useState(initialStatus);
  const [publishing, setPublishing] = useState(false);

  async function handleSaveSummary() {
    setSavingSummary(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("sessions")
      .update({ ai_summary: summaryDraft })
      .eq("id", sessionId);

    if (error) {
      toast.error("Failed to save summary", { description: error.message });
    } else {
      setAiSummary(summaryDraft);
      setEditingSummary(false);
      toast.success("Summary saved");
    }
    setSavingSummary(false);
  }

  async function handleSaveGmNotes() {
    setSavingNotes(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("sessions")
      .update({ gm_notes: notesDraft || null })
      .eq("id", sessionId);

    if (error) {
      toast.error("Failed to save notes", { description: error.message });
    } else {
      setGmNotes(notesDraft || null);
      setEditingNotes(false);
      toast.success("GM notes saved");
    }
    setSavingNotes(false);
  }

  async function handleTogglePublish() {
    setPublishing(true);
    const supabase = createClient();
    const newVisible = !playerVisible;
    const newStatus = newVisible ? "published" : "processed";

    const { error } = await supabase
      .from("sessions")
      .update({ player_visible: newVisible, status: newStatus })
      .eq("id", sessionId);

    if (error) {
      toast.error("Failed to update", { description: error.message });
    } else {
      setPlayerVisible(newVisible);
      setStatus(newStatus);
      toast.success(newVisible ? "Session published — visible to players" : "Session unpublished");
    }
    setPublishing(false);
  }

  return (
    <div className="space-y-6">
      {/* Publish Bar */}
      {isGm && (
        <Card className="grain">
          <CardContent className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
              {playerVisible ? (
                <>
                  <Eye className="size-4 text-gold" />
                  <span className="text-sm font-heading">Published — visible to players</span>
                </>
              ) : (
                <>
                  <EyeOff className="size-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Not visible to players</span>
                </>
              )}
              <Badge variant={status === "published" ? "default" : "secondary"} className="text-xs">
                {status}
              </Badge>
            </div>
            <Button
              size="sm"
              variant={playerVisible ? "outline" : "default"}
              onClick={handleTogglePublish}
              disabled={publishing || status === "draft" || status === "processing"}
              className={!playerVisible ? "gold-glow" : ""}
            >
              {publishing ? "Updating..." : playerVisible ? (
                <><EyeOff className="size-4 mr-1.5" />Unpublish</>
              ) : (
                <><Send className="size-4 mr-1.5" />Publish</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* AI Summary */}
      {(aiSummary || editingSummary) && (
        <>
          <Separator />
          <Card className="grain">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-heading">AI Summary</CardTitle>
              {isGm && !editingSummary && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSummaryDraft(aiSummary ?? "");
                    setEditingSummary(true);
                  }}
                  data-edit="summary"
                >
                  <Pencil className="size-3.5 mr-1" />
                  Edit Summary
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editingSummary ? (
                <div className="space-y-3">
                  <Textarea
                    value={summaryDraft}
                    onChange={(e) => setSummaryDraft(e.target.value)}
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveSummary} disabled={savingSummary} className="gold-glow">
                      <Save className="size-4 mr-1" />
                      {savingSummary ? "Saving..." : "Save"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingSummary(false)}>
                      <X className="size-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm font-lore">{aiSummary}</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* GM Notes */}
      {isGm && (
        <>
          <Separator />
          <Card className="grain">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-heading">GM Notes</CardTitle>
              {!editingNotes && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setNotesDraft(gmNotes ?? "");
                    setEditingNotes(true);
                  }}
                >
                  <Pencil className="size-3.5 mr-1" />
                  {gmNotes ? "Edit" : "Add Notes"}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editingNotes ? (
                <div className="space-y-3">
                  <Textarea
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    rows={4}
                    placeholder="Private notes for this session — never visible to players..."
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveGmNotes} disabled={savingNotes} className="gold-glow">
                      <Save className="size-4 mr-1" />
                      {savingNotes ? "Saving..." : "Save"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingNotes(false)}>
                      <X className="size-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : gmNotes ? (
                <p className="text-sm italic text-muted-foreground">{gmNotes}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No GM notes yet. Click &ldquo;Add Notes&rdquo; to add private session notes.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
