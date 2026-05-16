"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConversationCreate } from "./conversation-create";
import { cn } from "@/lib/utils";
import { ChevronLeft, EyeOff, Plus } from "lucide-react";

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

interface ConversationListProps {
  campaignId: string;
  campaignName: string;
  conversations: Conversation[];
  sessions: Session[];
  role: string;
  userId: string;
  knownEntities: KnownEntity[];
}

export function ConversationList({
  campaignId,
  campaignName: _campaignName,
  conversations,
  sessions,
  role,
  userId,
  knownEntities,
}: ConversationListProps) {
  const router = useRouter();
  const isGm = role === "gm";
  const [sessionFilter, setSessionFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(
    conversations[0]?.id ?? null
  );

  const filtered = useMemo(() => {
    let result = conversations;
    if (sessionFilter !== "all") {
      result = result.filter((c) => c.session_id === sessionFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => {
        const participantMatch = c.participants.some((p) =>
          p.name.toLowerCase().includes(q)
        );
        const titleMatch = c.title?.toLowerCase().includes(q);
        const contentMatch = c.content_plain?.toLowerCase().includes(q);
        return participantMatch || titleMatch || contentMatch;
      });
    }
    return result;
  }, [conversations, sessionFilter, search]);

  const selected =
    filtered.find((c) => c.id === selectedId) ?? filtered[0] ?? null;

  return (
    <>
      <div className="fixed inset-0 z-[45] flex items-center justify-center overflow-hidden bg-leather">
        <div
          className="relative max-h-screen w-full"
          style={{ aspectRatio: "16 / 9" }}
        >
          <Image
            src="/textures/conversations-page.png"
            alt=""
            fill
            priority
            className="object-contain"
          />

          {/* Back link (top-left, over the candle area) */}
          <button
            onClick={() => router.push(`/campaign/${campaignId}`)}
            aria-label="Back to bookshelf"
            className="absolute left-[3%] top-[4%] z-10 flex items-center gap-1 text-gold/75 transition hover:text-gold"
          >
            <ChevronLeft className="size-4" />
            <span className="font-subheading text-[10px] uppercase tracking-[0.18em] sm:text-xs">
              Bookshelf
            </span>
          </button>

          {/* New conversation (GM only, top-right) */}
          {isGm && (
            <button
              onClick={() => setCreateOpen(true)}
              aria-label="New conversation"
              className="absolute right-[3%] top-[4%] z-10 flex items-center gap-1 text-gold/80 transition hover:text-gold"
            >
              <Plus className="size-4" />
              <span className="font-subheading text-[10px] uppercase tracking-[0.18em] sm:text-xs">
                New
              </span>
            </button>
          )}

          {/* Parchment content overlay — debug border (remove when sizing is right) */}
          <div
            className="absolute flex flex-col gap-3 text-leather"
            style={{
              left: "16%",
              right: "16%",
              top: "14%",
              bottom: "16%",
              border: "2px solid hotpink",
            }}
          >
            {/* Header row */}
            <div className="flex shrink-0 items-center gap-3">
              <h2 className="mr-auto font-heading text-base uppercase tracking-[0.15em] text-leather sm:text-lg">
                Conversations{" "}
                <span className="ml-1 font-sans text-xs font-normal text-leather/60 sm:text-sm">
                  ({conversations.length})
                </span>
              </h2>
              <Input
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-40 border-leather/30 bg-parchment/30 text-xs text-leather placeholder:text-leather/40"
              />
              <Select
                value={sessionFilter}
                onValueChange={(v) => setSessionFilter(v ?? "all")}
              >
                <SelectTrigger className="h-8 w-36 border-leather/30 bg-parchment/30 text-xs text-leather">
                  <SelectValue>
                    {sessionFilter === "all"
                      ? "All Sessions"
                      : sessions.find((s) => s.id === sessionFilter)?.title ??
                        "—"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sessions</SelectItem>
                  {sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Master-detail body */}
            <div className="flex min-h-0 flex-1 gap-3">
              {/* Master list */}
              <div className="scrollbar-none w-2/5 overflow-y-auto pr-2">
                {filtered.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-center text-xs italic text-leather/60">
                    {conversations.length === 0
                      ? "No conversations yet."
                      : "No matches."}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {filtered.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedId(c.id)}
                        className={cn(
                          "w-full rounded border border-leather/15 px-3 py-2 text-left transition",
                          "hover:bg-leather/5",
                          selected?.id === c.id &&
                            "border-leather/40 bg-leather/10"
                        )}
                      >
                        <div className="line-clamp-1 font-heading text-xs text-leather sm:text-sm">
                          {c.title ?? "Untitled"}
                        </div>
                        <div className="mt-0.5 line-clamp-1 text-[10px] text-leather/60 sm:text-xs">
                          {c.participants.map((p) => p.name).join(", ")}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Detail */}
              <div className="scrollbar-none flex-1 overflow-y-auto border-l border-leather/15 pl-3">
                {selected ? (
                  <ConversationDetail conversation={selected} isGm={isGm} />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs italic text-leather/60">
                    Select a conversation to view.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isGm && (
        <ConversationCreate
          campaignId={campaignId}
          userId={userId}
          knownEntities={knownEntities}
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={() => router.refresh()}
        />
      )}
    </>
  );
}

function ConversationDetail({
  conversation,
  isGm,
}: {
  conversation: Conversation;
  isGm: boolean;
}) {
  const turns = conversation.content ?? [];

  return (
    <div className="space-y-3 pb-3 pr-1">
      <div>
        <h3 className="font-heading text-sm uppercase tracking-[0.12em] text-leather sm:text-base">
          {conversation.title ?? "Untitled conversation"}
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {conversation.participants.map((p, i) => (
            <Badge
              key={i}
              variant="outline"
              className="border-leather/30 text-[9px] text-leather/80"
            >
              {p.name}
            </Badge>
          ))}
          {conversation.gm_only && (
            <Badge variant="secondary" className="text-[9px]">
              <EyeOff className="mr-1 size-3" />
              GM Only
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-1.5 border-l-2 border-leather/30 pl-3">
        {turns.map((turn, i) => (
          <div key={i} className="flex items-start gap-2 text-xs sm:text-sm">
            <Badge
              variant="outline"
              className="mt-0.5 shrink-0 border-leather/30 text-[9px] text-leather/70"
            >
              {turn.tone}
            </Badge>
            <p>
              <span className="font-medium text-leather">{turn.speaker}:</span>{" "}
              <span className="text-leather/80">{turn.text}</span>
            </p>
          </div>
        ))}
      </div>

      {isGm && conversation.gm_notes && (
        <div className="border-t border-leather/20 pt-2">
          <div className="mb-1 font-heading text-[10px] uppercase tracking-[0.12em] text-leather/60">
            GM Notes
          </div>
          <p className="text-[11px] italic text-leather/80 sm:text-xs">
            {conversation.gm_notes}
          </p>
        </div>
      )}
    </div>
  );
}
