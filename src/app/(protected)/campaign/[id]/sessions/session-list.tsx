"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
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
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/loomstory/empty-state";
import { ChevronLeft, Plus, ScrollText } from "lucide-react";

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

export function SessionList({
  campaignId,
  campaignName,
  sessions: initialSessions,
  role,
  userId,
}: SessionListProps) {
  const router = useRouter();
  const isGm = role === "gm";
  const [sessions, setSessions] = useState(
    isGm ? initialSessions : initialSessions.filter((s) => s.status === "published")
  );
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [datePlayed, setDatePlayed] = useState("");
  const [sessionNumber, setSessionNumber] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextSessionNumber =
    sessions.length > 0
      ? Math.max(...sessions.map((s) => s.session_number ?? 0)) + 1
      : 1;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);

    const supabase = createClient();

    const { data: session, error: createError } = await supabase
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

    if (createError || !session) {
      setError(createError?.message ?? "Failed to create session.");
      setCreating(false);
      return;
    }

    setOpen(false);
    setTitle("");
    setDatePlayed("");
    setSessionNumber("");
    setCreating(false);

    router.push(`/campaign/${campaignId}/session/${session.id}`);
  }

  const statusColor: Record<string, string> = {
    draft: "secondary",
    processing: "default",
    processed: "default",
    published: "default",
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <button
            onClick={() => router.push(`/campaign/${campaignId}`)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
          >
            <ChevronLeft className="size-4" />
            {campaignName}
          </button>
          <h2 className="text-2xl font-heading font-semibold">Sessions</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""} recorded
          </p>
        </div>

        {isGm && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <Button className="gold-glow font-heading">
                  <Plus className="size-4 mr-1.5" />
                  New Session
                </Button>
              }
            />
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle className="font-heading">
                    New Session
                  </DialogTitle>
                  <DialogDescription>
                    Create a session to start capturing notes.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {error && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-red-400">
                      {error}
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
                    onClick={() => setOpen(false)}
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
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          message="No sessions yet. Create your first session to start building your story."
          action={
            isGm
              ? { label: "New Session", onClick: () => setOpen(true) }
              : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <Card
              key={session.id}
              className="grain gold-glow cursor-pointer"
              onClick={() =>
                router.push(
                  `/campaign/${campaignId}/session/${session.id}`
                )
              }
            >
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  {session.session_number != null && (
                    <span className="text-xs text-muted-foreground font-mono w-8">
                      #{session.session_number}
                    </span>
                  )}
                  <span className="font-medium">{session.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  {session.date_played && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(session.date_played).toLocaleDateString()}
                    </span>
                  )}
                  <Badge
                    variant={
                      (statusColor[session.status] as "default" | "secondary") ??
                      "secondary"
                    }
                    className="text-xs"
                  >
                    {session.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
