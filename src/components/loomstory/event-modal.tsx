"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MasterDetailModal } from "@/components/shared/master-detail-modal";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { SectionHeader } from "@/components/loomstory/section-header";
import { GmOnlyBadge } from "@/components/shared/gm-only-badge";
import { EventCreate } from "@/app/(protected)/campaign/[id]/events/event-create";
import {
  CheckCircle, AlertTriangle, Pencil,
} from "lucide-react";

const TIME_LABELS: Record<number, string> = {
  0: "Midnight", 600: "Dawn", 900: "Morning", 1200: "Midday",
  1500: "Afternoon", 1800: "Evening", 2100: "Night",
};

const EVENT_TYPES = [
  "general", "scene", "decision", "discovery", "conversation",
  "promise", "todo", "upcoming", "milestone", "mood", "quote",
];

const TIME_OPTIONS = [
  { value: "600", label: "Dawn" }, { value: "900", label: "Morning" },
  { value: "1200", label: "Midday" }, { value: "1500", label: "Afternoon" },
  { value: "1800", label: "Evening" }, { value: "2100", label: "Night" },
  { value: "0", label: "Midnight" },
];

const EVENT_TYPE_FILTERS = [
  "all", "scene", "decision", "discovery", "promise", "todo",
  "upcoming", "milestone", "mood", "conversation", "quote", "general",
];

function getTimeLabel(time: number | null): string | null {
  if (time == null) return null;
  if (TIME_LABELS[time]) return TIME_LABELS[time];
  const keys = Object.keys(TIME_LABELS).map(Number).sort((a, b) => a - b);
  for (let i = keys.length - 1; i >= 0; i--) {
    if (time >= keys[i]) return TIME_LABELS[keys[i]];
  }
  return null;
}

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

interface EventModalProps {
  campaignId: string;
  userId: string;
  role: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventModal({
  campaignId,
  userId,
  role,
  open,
  onOpenChange,
}: EventModalProps) {
  const isGm = role === "gm";
  const [events, setEvents] = useState<CampaignEvent[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sessionFilter, setSessionFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let eventsQuery = supabase
      .from("campaign_events")
      .select("id, session_id, content, summary, weight, event_type, narrative_day, narrative_time, sequence, resolved, trigger_condition, gm_only, created_at")
      .eq("campaign_id", campaignId)
      .is("deleted_at", null);
    if (!isGm) eventsQuery = eventsQuery.eq("gm_only", false);
    const [eventsRes, sessionsRes] = await Promise.all([
      eventsQuery
        .order("narrative_day", { ascending: true, nullsFirst: false })
        .order("narrative_time", { ascending: true, nullsFirst: false })
        .order("sequence", { ascending: true }),
      supabase
        .from("sessions")
        .select("id, title, session_number")
        .eq("campaign_id", campaignId)
        .is("deleted_at", null)
        .order("session_number", { ascending: true }),
    ]);
    setEvents(eventsRes.data ?? []);
    setSessions(sessionsRes.data ?? []);
    setLoading(false);
  }, [campaignId, isGm]);

  useEffect(() => {
    if (open) fetchData();
  }, [open, fetchData]);

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
    <>
      <MasterDetailModal<CampaignEvent>
        title="Events"
        open={open}
        onOpenChange={onOpenChange}
        items={filteredEvents}
        loading={loading}
        onCreateClick={isGm ? () => setCreating(true) : undefined}
        createLabel="New Event"
        emptyMessage="No events yet. Process a session to extract events."
        renderFilters={() => (
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={sessionFilter} onValueChange={(v) => setSessionFilter(v ?? "all")}>
              <SelectTrigger className="w-[200px]">
                <SelectValue>
                  {sessionFilter === "all" ? "All Sessions" : getSessionTitle(sessionFilter) ?? "Unknown"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                {sessions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        )}
        renderListItem={(event, isSelected) => (
          <div>
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-14 text-right pt-0.5">
                {event.narrative_day != null && (
                  <p className="text-xs font-mono text-muted-foreground">
                    Day {event.narrative_day}
                  </p>
                )}
                {event.narrative_time != null && (
                  <p className="text-xs text-muted-foreground">
                    {getTimeLabel(event.narrative_time)}
                  </p>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <Badge variant="outline" className="text-[10px] capitalize">{event.event_type}</Badge>
                  <Badge variant="secondary" className="text-[10px]">w{event.weight}</Badge>
                  {event.resolved && (
                    <Badge variant="default" className="text-[10px]">
                      <CheckCircle className="size-2.5 mr-0.5" />Resolved
                    </Badge>
                  )}
                  {event.gm_only && <GmOnlyBadge />}
                </div>
                <p className={`text-sm line-clamp-2 ${isSelected ? "text-gold" : ""}`}>
                  {event.summary ?? event.content}
                </p>
              </div>
            </div>
          </div>
        )}
        renderDetail={(event) => (
          <EventDetailPanel
            event={event}
            campaignId={campaignId}
            role={role}
            onUpdated={fetchData}
          />
        )}
      />

      {isGm && (
        <EventCreate
          campaignId={campaignId}
          userId={userId}
          sessions={sessions}
          open={creating}
          onOpenChange={setCreating}
          onCreated={fetchData}
        />
      )}
    </>
  );
}

// ─── Event Detail Panel (right side of modal) ──────────────

interface EntityTag {
  entity_type: string;
  entity_id: string;
  entity_name: string;
  role: string;
}

function EventDetailPanel({
  event: initialEvent,
  campaignId,
  role,
  onUpdated,
}: {
  event: CampaignEvent;
  campaignId: string;
  role: string;
  onUpdated: () => void;
}) {
  const isGm = role === "gm";
  const [event, setEvent] = useState(initialEvent);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [entityTags, setEntityTags] = useState<EntityTag[]>([]);

  // Edit state
  const [content, setContent] = useState(event.content);
  const [summary, setSummary] = useState(event.summary ?? "");
  const [eventType, setEventType] = useState(event.event_type);
  const [weight, setWeight] = useState(String(event.weight));
  const [narrativeDay, setNarrativeDay] = useState(event.narrative_day != null ? String(event.narrative_day) : "");
  const [narrativeTime, setNarrativeTime] = useState(event.narrative_time != null ? String(event.narrative_time) : "");
  const [triggerCondition, setTriggerCondition] = useState(event.trigger_condition ?? "");

  // Sync when parent selection changes
  useEffect(() => {
    setEvent(initialEvent);
    setContent(initialEvent.content);
    setSummary(initialEvent.summary ?? "");
    setEventType(initialEvent.event_type);
    setWeight(String(initialEvent.weight));
    setNarrativeDay(initialEvent.narrative_day != null ? String(initialEvent.narrative_day) : "");
    setNarrativeTime(initialEvent.narrative_time != null ? String(initialEvent.narrative_time) : "");
    setTriggerCondition(initialEvent.trigger_condition ?? "");
    setEditing(false);
  }, [initialEvent]);

  // Fetch entity tags for this event
  useEffect(() => {
    async function fetchTags() {
      const supabase = createClient();
      const { data } = await supabase
        .from("event_entity_tags")
        .select("entity_type, entity_id, role")
        .eq("event_id", initialEvent.id);

      if (!data || data.length === 0) {
        setEntityTags([]);
        return;
      }

      // Resolve entity names
      const resolved: EntityTag[] = [];
      for (const tag of data) {
        const table = tag.entity_type === "npc" ? "npcs"
          : tag.entity_type === "location" ? "locations"
          : tag.entity_type === "faction" ? "factions"
          : tag.entity_type === "item" ? "items"
          : null;
        if (table) {
          const { data: entity } = await supabase
            .from(table)
            .select("name")
            .eq("id", tag.entity_id)
            .single();
          resolved.push({
            ...tag,
            entity_name: entity?.name ?? "Unknown",
          });
        }
      }
      setEntityTags(resolved);
    }
    fetchTags();
  }, [initialEvent.id]);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("campaign_events")
      .update({
        content,
        summary: summary || null,
        event_type: eventType,
        weight: parseInt(weight) || 3,
        narrative_day: narrativeDay ? parseInt(narrativeDay) : null,
        narrative_time: narrativeTime ? parseInt(narrativeTime) : null,
        trigger_condition: triggerCondition || null,
        updated_by: user?.id,
      })
      .eq("id", event.id);

    if (error) {
      toast.error("Failed to save", { description: error.message });
    } else {
      setEvent((prev) => ({
        ...prev,
        content,
        summary: summary || null,
        event_type: eventType,
        weight: parseInt(weight) || 3,
        narrative_day: narrativeDay ? parseInt(narrativeDay) : null,
        narrative_time: narrativeTime ? parseInt(narrativeTime) : null,
        trigger_condition: triggerCondition || null,
      }));
      setEditing(false);
      toast.success("Event updated");
      onUpdated();
    }
    setSaving(false);
  }

  async function handleResolve() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("campaign_events")
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        updated_by: user?.id,
      })
      .eq("id", event.id);

    if (error) {
      toast.error("Failed to resolve", { description: error.message });
      return;
    }
    setEvent((prev) => ({ ...prev, resolved: true }));
    toast.success("Event resolved");
    onUpdated();
  }

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("campaign_events")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", event.id);

    if (error) {
      toast.error("Failed to delete", { description: error.message });
      setDeleting(false);
      return;
    }
    toast.success("Event archived");
    setDeleteOpen(false);
    setDeleting(false);
    onUpdated();
  }

  function cancelEdit() {
    setEditing(false);
    setContent(event.content);
    setSummary(event.summary ?? "");
    setEventType(event.event_type);
    setWeight(String(event.weight));
    setNarrativeDay(event.narrative_day != null ? String(event.narrative_day) : "");
    setNarrativeTime(event.narrative_time != null ? String(event.narrative_time) : "");
    setTriggerCondition(event.trigger_condition ?? "");
  }

  if (editing && isGm) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-heading font-semibold">Edit Event</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-content">Content</Label>
            <Textarea id="edit-content" value={content} onChange={(e) => setContent(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-summary">Summary</Label>
            <Input id="edit-summary" value={summary} onChange={(e) => setSummary(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={eventType} onValueChange={(v) => setEventType(v ?? "general")}>
                <SelectTrigger><SelectValue>{eventType}</SelectValue></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (<SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-weight">Weight (1-7)</Label>
              <Input id="edit-weight" type="number" min={1} max={7} value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-day">Narrative Day</Label>
              <Input id="edit-day" type="number" value={narrativeDay} onChange={(e) => setNarrativeDay(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Time of Day</Label>
              <Select value={narrativeTime} onValueChange={(v) => setNarrativeTime(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Select time...">{narrativeTime ? TIME_OPTIONS.find((t) => t.value === narrativeTime)?.label : undefined}</SelectValue></SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-trigger">Trigger Condition</Label>
            <Input id="edit-trigger" value={triggerCondition} onChange={(e) => setTriggerCondition(e.target.value)} placeholder="When/if this should surface..." />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} className="gold-glow">{saving ? "Saving..." : "Save"}</Button>
            <Button variant="ghost" onClick={cancelEdit}>Cancel</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-xl font-heading font-semibold">
          {event.summary ?? "Event"}
        </h3>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Badge variant="outline" className="text-xs capitalize">{event.event_type}</Badge>
          <Badge variant="secondary" className="text-xs">w{event.weight}</Badge>
          {event.resolved && (
            <Badge variant="default" className="text-xs">
              <CheckCircle className="size-3 mr-1" />Resolved
            </Badge>
          )}
          {event.gm_only && <GmOnlyBadge />}
          {event.narrative_day != null && (
            <span className="text-xs text-muted-foreground font-mono">Day {event.narrative_day}</span>
          )}
          {event.narrative_time != null && (
            <span className="text-xs text-muted-foreground">{getTimeLabel(event.narrative_time)}</span>
          )}
        </div>
      </div>

      {/* Content */}
      <Card className="grain">
        <CardContent className="py-4">
          <p className="text-sm font-lore">{event.content}</p>
        </CardContent>
      </Card>

      {/* Trigger condition */}
      {event.trigger_condition && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertTriangle className="size-4 text-gold shrink-0" />
          <span className="italic">Trigger: {event.trigger_condition}</span>
        </div>
      )}

      {/* Entity Tags */}
      {entityTags.length > 0 && (
        <div>
          <SectionHeader>Tagged Entities</SectionHeader>
          <div className="flex flex-wrap gap-2">
            {entityTags.map((tag, i) => (
              <div key={i} className="inline-flex items-center gap-1.5 bg-leather rounded px-2 py-1">
                <Badge variant="outline" className="text-[10px]">{tag.entity_type}</Badge>
                <span className="text-sm font-medium">{tag.entity_name}</span>
                <Badge variant="secondary" className="text-[10px]">{tag.role}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {isGm && (
        <div className="flex items-center gap-2 pt-2">
          {!event.resolved && (
            <Button variant="outline" size="sm" onClick={handleResolve}>
              <CheckCircle className="size-4 mr-1" />
              Resolve
            </Button>
          )}
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="size-4 mr-1.5" />
            Edit
          </Button>
          <Button variant="ghost" size="sm" className="text-red-400" onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        </div>
      )}

      <ConfirmDeleteDialog
        entityName={event.summary ?? "this event"}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </div>
  );
}
