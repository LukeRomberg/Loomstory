"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/loomstory/empty-state";
import { ChevronLeft, Scroll, Clock, Calendar, CheckCircle, AlertTriangle } from "lucide-react";

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
  // Exact match first
  if (TIME_LABELS[time]) return TIME_LABELS[time];
  // Closest match
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
}

export function EventList({
  campaignId,
  campaignName,
  events,
  sessions,
  role,
}: EventListProps) {
  const router = useRouter();
  const [sessionFilter, setSessionFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredEvents = useMemo(() => {
    let result = events;
    if (sessionFilter !== "all") {
      result = result.filter((e) => e.session_id === sessionFilter);
    }
    if (typeFilter !== "all") {
      result = result.filter((e) => e.event_type === typeFilter);
    }
    return result;
  }, [events, sessionFilter, typeFilter]);

  function getSessionTitle(sessionId: string | null): string | null {
    if (!sessionId) return null;
    const session = sessions.find((s) => s.id === sessionId);
    return session ? session.title : null;
  }

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
          <h2 className="text-2xl font-heading font-semibold">Events</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {events.length} event{events.length !== 1 ? "s" : ""} in this campaign
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* Session filter */}
        <Select value={sessionFilter} onValueChange={(v) => setSessionFilter(v ?? "all")}>
          <SelectTrigger className="w-[200px]">
            <SelectValue>
              {sessionFilter === "all"
                ? "All Sessions"
                : getSessionTitle(sessionFilter) ?? "Unknown Session"}
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

        {/* Type filter */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {EVENT_TYPE_FILTERS.map((type) => (
            <Button
              key={type}
              variant={typeFilter === type ? "default" : "ghost"}
              size="xs"
              onClick={() => setTypeFilter(type)}
              className="font-heading capitalize"
            >
              {type}
            </Button>
          ))}
        </div>
      </div>

      {/* Event List */}
      {filteredEvents.length === 0 ? (
        <EmptyState
          icon={Scroll}
          message={events.length === 0 ? "No events yet. Process a session to extract events." : "No events match the current filters."}
        />
      ) : (
        <div className="space-y-2">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="grain">
              <CardContent className="py-3">
                <div className="flex items-start gap-3">
                  {/* Timeline marker */}
                  <div className="shrink-0 w-16 text-right pt-0.5">
                    {event.narrative_day != null && (
                      <p className="text-xs font-mono text-muted-foreground">
                        Day {event.narrative_day}
                      </p>
                    )}
                    {event.narrative_time != null && (
                      <p className="text-xs text-muted-foreground">
                        {getTimeLabel(event.narrative_time) ?? `${event.narrative_time}`}
                      </p>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Badges row */}
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <Badge variant="outline" className="text-xs capitalize">
                        {event.event_type}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        w{event.weight}
                      </Badge>
                      {event.resolved && (
                        <Badge variant="default" className="text-xs">
                          <CheckCircle className="size-3 mr-1" />
                          Resolved
                        </Badge>
                      )}
                      {getSessionTitle(event.session_id) && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          {getSessionTitle(event.session_id)}
                        </Badge>
                      )}
                    </div>

                    {/* Summary / Content */}
                    <p className="text-sm font-medium">
                      {event.summary ?? event.content}
                    </p>
                    {event.summary && event.content !== event.summary && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {event.content}
                      </p>
                    )}

                    {/* Trigger condition */}
                    {event.trigger_condition && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                        <AlertTriangle className="size-3 text-gold shrink-0" />
                        <span className="italic">{event.trigger_condition}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
