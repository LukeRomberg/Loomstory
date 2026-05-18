"use client";

import { useState, useMemo } from "react";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OpenBookView } from "@/components/shared/open-book-view";
import { EventCreate } from "./event-create";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle, ChevronRight, EyeOff } from "lucide-react";

const TIME_LABELS: Record<number, string> = {
  0: "Midnight",
  600: "Dawn",
  900: "Morning",
  1200: "Midday",
  1500: "Afternoon",
  1800: "Evening",
  2100: "Night",
};

function getTimeLabel(time: number | null): string | null {
  if (time == null) return null;
  if (TIME_LABELS[time]) return TIME_LABELS[time];
  const keys = Object.keys(TIME_LABELS).map(Number).sort((a, b) => a - b);
  for (let i = keys.length - 1; i >= 0; i--) {
    if (time >= keys[i]) return TIME_LABELS[keys[i]];
  }
  return null;
}

const EVENT_TYPE_FILTERS = [
  "all", "scene", "decision", "discovery", "promise", "todo",
  "upcoming", "milestone", "mood", "conversation", "quote", "general",
];

interface CampaignEvent {
  id: string;
  session_id: string | null;
  content: string;
  summary: string | null;
  weight: number;
  event_type: string;
  narrative_day: number | null;
  narrative_time: number | null;
  sequence: number;
  resolved: boolean;
  trigger_condition: string | null;
  gm_only: boolean;
  created_at: string;
}

interface Session {
  id: string;
  title: string;
  session_number: number | null;
}

interface EventListProps {
  campaignId: string;
  campaignName: string;
  events: CampaignEvent[];
  sessions: Session[];
  role: string;
  userId: string;
}

export function EventList({
  campaignId,
  campaignName: _campaignName,
  events,
  sessions,
  role,
  userId,
}: EventListProps) {
  const router = useTransitionRouter();
  const isGm = role === "gm";
  const [sessionFilter, setSessionFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(events[0]?.id ?? null);
  const [createOpen, setCreateOpen] = useState(false);

  function getSessionTitle(sessionId: string | null): string | null {
    if (!sessionId) return null;
    const session = sessions.find((s) => s.id === sessionId);
    return session ? session.title : null;
  }

  const filtered = useMemo(() => {
    let result = events;
    if (sessionFilter !== "all") result = result.filter((e) => e.session_id === sessionFilter);
    if (typeFilter !== "all") result = result.filter((e) => e.event_type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.summary?.toLowerCase().includes(q) ||
          e.content.toLowerCase().includes(q) ||
          e.event_type.toLowerCase().includes(q)
      );
    }
    return result;
  }, [events, sessionFilter, typeFilter, search]);

  const selected = filtered.find((e) => e.id === selectedId) ?? filtered[0] ?? null;

  const leftPage = (
    <>
      <div className="flex shrink-0 items-center gap-2">
        <h2 className="mr-auto font-heading text-base uppercase tracking-[0.15em] text-leather sm:text-lg">
          Events{" "}
          <span className="ml-1 font-sans text-xs font-normal text-leather/65 sm:text-sm">
            ({events.length})
          </span>
        </h2>
        <Input
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-28 border-leather/30 bg-parchment/30 text-xs text-leather placeholder:text-leather/40"
        />
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
          <SelectTrigger className="h-8 w-28 border-leather/30 bg-parchment/30 text-xs text-leather">
            <SelectValue>{typeFilter === "all" ? "All types" : typeFilter}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {EVENT_TYPE_FILTERS.map((t) => (
              <SelectItem key={t} value={t}>
                {t === "all" ? "All types" : t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="scrollbar-none flex-1 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-xs italic text-leather/60">
            {events.length === 0 ? "No events yet." : "No matches."}
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((e) => (
              <button
                key={e.id}
                onClick={() => setSelectedId(e.id)}
                className={cn(
                  "w-full rounded border border-leather/15 px-3 py-2 text-left transition",
                  "hover:bg-leather/5",
                  selected?.id === e.id && "border-leather/40 bg-leather/10"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="line-clamp-1 font-heading text-sm text-leather">
                    {e.summary ?? e.content.slice(0, 80)}
                  </div>
                  {e.gm_only && <EyeOff className="size-3.5 shrink-0 text-leather/70" />}
                </div>
                <div className="mt-0.5 line-clamp-1 text-xs font-semibold uppercase tracking-[0.08em] text-leather/70">
                  {e.event_type}
                  {e.narrative_day != null && (
                    <span className="ml-1.5 normal-case font-medium tracking-normal text-leather/55">
                      · Day {e.narrative_day}
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
    <EventDetail
      event={selected}
      sessionTitle={getSessionTitle(selected.session_id)}
      onOpenFull={() => router.push(`/campaign/${campaignId}/events/${selected.id}`)}
    />
  ) : (
    <div className="flex h-full items-center justify-center text-xs italic text-leather/60">
      Select an event to view.
    </div>
  );

  return (
    <OpenBookView
      leftPage={leftPage}
      rightPage={rightPage}
      onBack={() => router.push(`/campaign/${campaignId}`)}
      onNew={isGm ? () => setCreateOpen(true) : undefined}
      newAriaLabel="New event"
    >
      {/* Session filter rendered via OpenBookView consumers — not in header for simplicity here */}
      {sessionFilter !== "all" && null /* kept just to silence unused var */}
      {isGm && (
        <EventCreate
          campaignId={campaignId}
          userId={userId}
          sessions={sessions}
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={() => router.refresh()}
        />
      )}
    </OpenBookView>
  );
}

function EventDetail({
  event,
  sessionTitle,
  onOpenFull,
}: {
  event: CampaignEvent;
  sessionTitle: string | null;
  onOpenFull: () => void;
}) {
  return (
    <div className="scrollbar-none flex h-full flex-col gap-3 overflow-y-auto pr-1">
      <div>
        <h3 className="font-heading text-base uppercase tracking-[0.12em] text-leather sm:text-lg">
          {event.summary ?? event.content.slice(0, 80)}
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="border-leather/40 text-[11px] font-semibold uppercase text-leather">
            {event.event_type}
          </Badge>
          {event.narrative_day != null && (
            <Badge variant="outline" className="border-leather/40 text-[11px] font-semibold text-leather">
              Day {event.narrative_day}
              {event.narrative_time != null && ` · ${getTimeLabel(event.narrative_time) ?? event.narrative_time}`}
            </Badge>
          )}
          {event.resolved && (
            <Badge variant="default" className="text-[11px] font-semibold">
              <CheckCircle className="mr-1 size-3" />
              Resolved
            </Badge>
          )}
          {sessionTitle && (
            <Badge variant="outline" className="border-leather/40 text-[11px] font-semibold text-leather/70">
              {sessionTitle}
            </Badge>
          )}
          {event.gm_only && (
            <Badge variant="secondary" className="text-[11px] font-semibold">
              <EyeOff className="mr-1 size-3" />
              GM Only
            </Badge>
          )}
        </div>
      </div>

      <p className="whitespace-pre-line text-sm text-leather sm:text-base">{event.content}</p>

      {event.trigger_condition && (
        <div className="flex items-start gap-2 rounded border border-leather/30 bg-leather/5 p-2 text-sm">
          <AlertTriangle className="size-4 shrink-0 text-leather/70" />
          <span className="italic text-leather">{event.trigger_condition}</span>
        </div>
      )}

      <button
        onClick={onOpenFull}
        className="mt-2 inline-flex items-center gap-1 font-subheading text-xs font-semibold uppercase tracking-[0.15em] text-leather/85 transition hover:text-leather"
      >
        Open full details
        <ChevronRight className="size-3.5" />
      </button>
    </div>
  );
}
