"use client";

import { useState, useMemo, useCallback } from "react";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OpenBookView } from "@/components/shared/open-book-view";
import {
  MasterList,
  MasterListItem,
} from "@/components/shared/master-list";
import { SessionDetail } from "./session-detail";

interface SessionRow {
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
  created_at: string;
}

interface SessionListProps {
  campaignId: string;
  campaignName: string;
  sessions: SessionRow[];
  role: string;
  userId: string;
}

export function SessionList({
  campaignId,
  campaignName: _campaignName,
  sessions: initialSessions,
  role,
  userId,
}: SessionListProps) {
  const router = useTransitionRouter();
  const searchParams = useSearchParams();
  const isGm = role === "gm";
  const visible = isGm
    ? initialSessions
    : initialSessions.filter((s) => s.status === "published");

  const [sessions, setSessions] = useState(visible);
  const [search, setSearch] = useState("");
  const urlSelected = searchParams.get("selected");
  const [selectedId, setSelectedId] = useState<string | null>(
    urlSelected ?? visible[0]?.id ?? null
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [datePlayed, setDatePlayed] = useState("");
  const [sessionNumber, setSessionNumber] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const nextSessionNumber =
    sessions.length > 0
      ? Math.max(...sessions.map((s) => s.session_number ?? 0)) + 1
      : 1;

  const filtered = useMemo(() => {
    if (!search.trim()) return sessions;
    const q = search.toLowerCase();
    return sessions.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.session_number != null && String(s.session_number).includes(q)) ||
        s.status.toLowerCase().includes(q)
    );
  }, [sessions, search]);

  const selected =
    filtered.find((s) => s.id === selectedId) ?? filtered[0] ?? null;

  const selectSession = useCallback(
    (id: string) => {
      setSelectedId(id);
      router.replace(`/campaign/${campaignId}/sessions?selected=${id}`);
    },
    [campaignId, router]
  );

  const handleDeleted = useCallback(() => {
    if (!selected) return;
    const remaining = sessions.filter((s) => s.id !== selected.id);
    setSessions(remaining);
    setSelectedId(remaining[0]?.id ?? null);
  }, [sessions, selected]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);

    const supabase = createClient();
    const { data: session, error } = await supabase
      .from("sessions")
      .insert({
        campaign_id: campaignId,
        title,
        date_played: datePlayed || null,
        session_number: sessionNumber
          ? parseInt(sessionNumber)
          : nextSessionNumber,
        status: "draft",
        created_by: userId,
      })
      .select()
      .single();

    if (error || !session) {
      setCreateError(error?.message ?? "Failed to create session.");
      setCreating(false);
      return;
    }

    const created: SessionRow = {
      id: session.id,
      title: session.title,
      date_played: session.date_played ?? null,
      session_number: session.session_number ?? null,
      raw_notes: null,
      ai_summary: null,
      gm_notes: null,
      player_summary: null,
      player_visible: false,
      status: session.status ?? "draft",
      created_by: session.created_by ?? userId,
      created_at: session.created_at ?? new Date().toISOString(),
      ...session,
    };
    setSessions((prev) => [created, ...prev]);
    selectSession(created.id);
    setCreateOpen(false);
    setTitle("");
    setDatePlayed("");
    setSessionNumber("");
    setCreating(false);
  }

  const leftPage = (
    <MasterList
      title="Sessions"
      count={sessions.length}
      search={search}
      onSearchChange={setSearch}
      isEmpty={filtered.length === 0}
      emptyMessage={sessions.length === 0 ? "No sessions yet." : "No matches."}
    >
      {filtered.map((s) => (
        <MasterListItem
          key={s.id}
          selected={selected?.id === s.id}
          onClick={() => selectSession(s.id)}
          title={
            s.session_number != null
              ? `#${s.session_number} ${s.title}`
              : s.title
          }
          subtitle={
            <>
              {s.status}
              {s.date_played && (
                <span className="ml-1.5 normal-case font-medium tracking-normal text-leather/55">
                  · {new Date(s.date_played).toLocaleDateString()}
                </span>
              )}
            </>
          }
        />
      ))}
    </MasterList>
  );

  const rightPage = selected ? (
    <SessionDetail
      key={selected.id}
      campaignId={campaignId}
      session={selected}
      role={role}
      userId={userId}
      onDeleted={handleDeleted}
    />
  ) : (
    <div className="flex h-full items-center justify-center text-xs italic text-leather/60">
      Select a session to view.
    </div>
  );

  return (
    <OpenBookView
      leftPage={leftPage}
      rightPage={rightPage}
      onBack={() => router.push(`/campaign/${campaignId}`)}
      onNew={isGm ? () => setCreateOpen(true) : undefined}
      newAriaLabel="New session"
    >
      {isGm && (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle className="font-heading">New Session</DialogTitle>
                <DialogDescription>
                  Create a session to start capturing notes.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {createError && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-red-400">
                    {createError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="session-title">Title</Label>
                  <Input
                    id="session-title"
                    placeholder="The Siege of Ironhold"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="session-number">Session #</Label>
                    <Input
                      id="session-number"
                      type="number"
                      placeholder={String(nextSessionNumber)}
                      value={sessionNumber}
                      onChange={(e) => setSessionNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date-played">Date Played</Label>
                    <Input
                      id="date-played"
                      type="date"
                      value={datePlayed}
                      onChange={(e) => setDatePlayed(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating || !title.trim()}
                  className="gold-glow"
                >
                  {creating ? "Creating..." : "Create Session"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </OpenBookView>
  );
}
