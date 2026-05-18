"use client";

import { useState, useMemo, useCallback } from "react";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import { useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OpenBookView } from "@/components/shared/open-book-view";
import {
  MasterList,
  MasterListItem,
} from "@/components/shared/master-list";
import { EventCreate } from "./event-create";
import { EventDetail } from "./event-detail";

const EVENT_TYPE_FILTERS = [
  "all",
  "scene",
  "decision",
  "discovery",
  "promise",
  "todo",
  "upcoming",
  "milestone",
  "mood",
  "conversation",
  "quote",
  "general",
];

interface EntityTag {
  entity_type: string;
  entity_id: string;
  entity_name: string;
  role: string;
}

interface CampaignEvent {
  id: string;
  session_id: string | null;
  parent_id?: string | null;
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
  entity_tags?: EntityTag[];
  children_count?: number;
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
  events: initialEvents,
  sessions,
  role,
  userId,
}: EventListProps) {
  const router = useTransitionRouter();
  const searchParams = useSearchParams();
  const isGm = role === "gm";
  const [events, setEvents] = useState(initialEvents);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const urlSelected = searchParams.get("selected");
  const [selectedId, setSelectedId] = useState<string | null>(
    urlSelected ?? initialEvents[0]?.id ?? null
  );
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    let result = events;
    if (typeFilter !== "all")
      result = result.filter((e) => e.event_type === typeFilter);
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
  }, [events, typeFilter, search]);

  const selected =
    events.find((e) => e.id === selectedId) ?? filtered[0] ?? null;

  const selectEvent = useCallback(
    (id: string) => {
      setSelectedId(id);
      router.replace(`/campaign/${campaignId}/events?selected=${id}`);
    },
    [campaignId, router]
  );

  const handleDeleted = useCallback(() => {
    if (!selected) return;
    const remaining = events.filter((e) => e.id !== selected.id);
    setEvents(remaining);
    setSelectedId(remaining[0]?.id ?? null);
  }, [events, selected]);

  const leftPage = (
    <MasterList
      title="Events"
      count={events.length}
      search={search}
      onSearchChange={setSearch}
      isEmpty={filtered.length === 0}
      emptyMessage={events.length === 0 ? "No events yet." : "No matches."}
      headerExtras={
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v ?? "all")}
        >
          <SelectTrigger className="h-8 w-28 border-leather/30 bg-parchment/30 text-xs text-leather">
            <SelectValue>
              {typeFilter === "all" ? "All types" : typeFilter}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {EVENT_TYPE_FILTERS.map((t) => (
              <SelectItem key={t} value={t}>
                {t === "all" ? "All types" : t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      {filtered.map((e) => (
        <MasterListItem
          key={e.id}
          selected={selected?.id === e.id}
          onClick={() => selectEvent(e.id)}
          title={e.summary ?? e.content.slice(0, 80)}
          hidden={e.gm_only}
          subtitle={
            <>
              {e.event_type}
              {e.narrative_day != null && (
                <span className="ml-1.5 normal-case font-medium tracking-normal text-leather/55">
                  · Day {e.narrative_day}
                </span>
              )}
            </>
          }
        />
      ))}
    </MasterList>
  );

  const rightPage = selected ? (
    <EventDetail
      key={selected.id}
      campaignId={campaignId}
      event={selected}
      role={role}
      onDeleted={handleDeleted}
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
