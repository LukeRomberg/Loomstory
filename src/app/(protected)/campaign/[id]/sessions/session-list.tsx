"use client";

import { useState, useMemo } from "react";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OpenBookView } from "@/components/shared/open-book-view";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface Session {
  id: string;
  title: string;
  date_played: string | null;
  session_number: number | null;
  status: string;
  created_at: string;
}

interface SessionListProps {
  campaignId: string;
  campaignName: string;
  sessions: Session[];
  role: string;
  userId: string;
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  draft: "secondary",
  processing: "default",
  processed: "default",
  published: "default",
};

export function SessionList({
  campaignId,
  campaignName: _campaignName,
  sessions: initialSessions,
  role,
  userId,
}: SessionListProps) {
  const router = useTransitionRouter();
  const isGm = role === "gm";
  const visible = isGm
    ? initialSessions
    : initialSessions.filter((s) => s.status === "published");

  const [sessions] = useState(visible);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    visible[0]?.id ?? null
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

  const selected = filtered.find((s) => s.id === selectedId) ?? filtered[0] ?? null;

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
        session_number: sessionNumber ? parseInt(sessionNumber) : nextSessionNumber,
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

    setCreateOpen(false);
    setTitle("");
    setDatePlayed("");
    setSessionNumber("");
    setCreating(false);
    router.push(`/campaign/${campaignId}/session/${session.id}`);
  }

  const leftPage = (
    <>
      <div className="flex shrink-0 items-center gap-2">
        <h2 className="mr-auto font-heading text-base uppercase tracking-[0.15em] text-leather sm:text-lg">
          Sessions{" "}
          <span className="ml-1 font-sans text-xs font-normal text-leather/65 sm:text-sm">
            ({sessions.length})
          </span>
        </h2>
        <Input
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-40 border-leather/30 bg-parchment/30 text-xs text-leather placeholder:text-leather/40"
        />
      </div>

      <div className="scrollbar-none flex-1 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-xs italic text-leather/60">
            {sessions.length === 0 ? "No sessions yet." : "No matches."}
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={cn(
                  "w-full rounded border border-leather/15 px-3 py-2 text-left transition",
                  "hover:bg-leather/5",
                  selected?.id === s.id && "border-leather/40 bg-leather/10"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-baseline gap-1.5 min-w-0">
                    {s.session_number != null && (
                      <span className="shrink-0 font-mono text-xs font-semibold text-leather/70">
                        #{s.session_number}
                      </span>
                    )}
                    <div className="line-clamp-1 font-heading text-sm text-leather">
                      {s.title}
                    </div>
                  </div>
                </div>
                <div className="mt-0.5 line-clamp-1 text-xs font-semibold uppercase tracking-[0.08em] text-leather/70">
                  {s.status}
                  {s.date_played && (
                    <span className="ml-1.5 normal-case font-medium tracking-normal text-leather/55">
                      · {new Date(s.date_played).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );

  const rightPage = selected ? (
    <SessionDetail
      session={selected}
      onOpenFull={() =>
        router.push(`/campaign/${campaignId}/session/${selected.id}`)
      }
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
                <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating || !title.trim()} className="gold-glow">
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

function SessionDetail({
  session,
  onOpenFull,
}: {
  session: Session;
  onOpenFull: () => void;
}) {
  const variant = STATUS_VARIANTS[session.status] ?? "secondary";
  return (
    <div className="scrollbar-none flex h-full flex-col gap-3 overflow-y-auto pr-1">
      <div>
        <div className="flex items-baseline gap-2">
          {session.session_number != null && (
            <span className="font-mono text-sm font-semibold text-leather/70">
              #{session.session_number}
            </span>
          )}
          <h3 className="font-heading text-base uppercase tracking-[0.12em] text-leather sm:text-lg">
            {session.title}
          </h3>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Badge variant={variant} className="text-[11px] font-semibold uppercase">
            {session.status}
          </Badge>
          {session.date_played && (
            <Badge
              variant="outline"
              className="border-leather/40 text-[11px] font-semibold text-leather"
            >
              {new Date(session.date_played).toLocaleDateString()}
            </Badge>
          )}
        </div>
      </div>

      <p className="text-sm italic text-leather/80">
        Open the session to view notes, encounters, and prep.
      </p>

      <button
        onClick={onOpenFull}
        className="mt-2 inline-flex items-center gap-1 font-subheading text-xs font-semibold uppercase tracking-[0.15em] text-leather/85 transition hover:text-leather"
      >
        Open session
        <ChevronRight className="size-3.5" />
      </button>
    </div>
  );
}
