"use client";

import { useState } from "react";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  BookCard,
  BookCardContent,
  BookCardHeader,
  BookCardTitle,
} from "@/components/shared/book-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pencil,
  Trash2,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const TIME_LABELS: Record<number, string> = {
  0: "Midnight",
  600: "Dawn",
  900: "Morning",
  1200: "Midday",
  1500: "Afternoon",
  1800: "Evening",
  2100: "Night",
};

const EVENT_TYPES = [
  "general",
  "scene",
  "decision",
  "discovery",
  "conversation",
  "promise",
  "todo",
  "upcoming",
  "milestone",
  "mood",
  "quote",
];

const TIME_OPTIONS = [
  { value: "600", label: "Dawn" },
  { value: "900", label: "Morning" },
  { value: "1200", label: "Midday" },
  { value: "1500", label: "Afternoon" },
  { value: "1800", label: "Evening" },
  { value: "2100", label: "Night" },
  { value: "0", label: "Midnight" },
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

const ENTITY_ROUTES: Record<string, string> = {
  npc: "npcs",
  location: "locations",
  faction: "factions",
  item: "items",
};

interface EventDetailProps {
  campaignId: string;
  event: CampaignEvent;
  role: string;
  onDeleted?: () => void;
}

export function EventDetail({
  campaignId,
  event: initialEvent,
  role,
  onDeleted,
}: EventDetailProps) {
  const router = useTransitionRouter();
  const isGm = role === "gm";
  const [event, setEvent] = useState(initialEvent);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit state
  const [content, setContent] = useState(event.content);
  const [summary, setSummary] = useState(event.summary ?? "");
  const [eventType, setEventType] = useState(event.event_type);
  const [weight, setWeight] = useState(String(event.weight));
  const [narrativeDay, setNarrativeDay] = useState(
    event.narrative_day != null ? String(event.narrative_day) : ""
  );
  const [narrativeTime, setNarrativeTime] = useState(
    event.narrative_time != null ? String(event.narrative_time) : ""
  );
  const [triggerCondition, setTriggerCondition] = useState(
    event.trigger_condition ?? ""
  );

  function getTimeLabel(time: number | null): string | null {
    if (time == null) return null;
    return TIME_LABELS[time] ?? null;
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
    }
    setSaving(false);
  }

  async function handleResolve() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
  }

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("soft_delete_entity", {
      p_entity_type: "event",
      p_entity_id: event.id,
    });

    if (error) {
      toast.error("Failed to delete", { description: error.message });
      setDeleting(false);
      return;
    }
    toast.success("Event archived");
    setDeleteOpen(false);
    setDeleting(false);
    onDeleted?.();
  }

  function cancelEdit() {
    setEditing(false);
    setContent(event.content);
    setSummary(event.summary ?? "");
    setEventType(event.event_type);
    setWeight(String(event.weight));
    setNarrativeDay(
      event.narrative_day != null ? String(event.narrative_day) : ""
    );
    setNarrativeTime(
      event.narrative_time != null ? String(event.narrative_time) : ""
    );
    setTriggerCondition(event.trigger_condition ?? "");
  }

  function navigateToEntity(entityType: string, entityId: string) {
    const route = ENTITY_ROUTES[entityType] ?? entityType;
    if (entityType === "npc") {
      router.push(`/campaign/${campaignId}/${route}?selected=${entityId}`);
    } else {
      router.push(`/campaign/${campaignId}/${route}/${entityId}`);
    }
  }

  return (
    <div className="scrollbar-none flex h-full flex-col gap-4 overflow-y-auto pr-1 text-leather">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-lg font-semibold uppercase tracking-[0.12em] text-leather sm:text-xl">
            {event.summary ?? "Event"}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              className="border-leather/40 text-[11px] font-semibold uppercase capitalize text-leather"
            >
              {event.event_type}
            </Badge>
            <Badge
              variant="outline"
              className="border-leather/40 bg-leather/10 text-[11px] font-semibold text-leather"
            >
              w{event.weight}
            </Badge>
            {event.resolved && (
              <Badge
                variant="outline"
                className="border-leather/40 bg-leather/10 text-[11px] font-semibold text-leather"
              >
                <CheckCircle className="mr-1 size-3" />
                Resolved
              </Badge>
            )}
            {event.narrative_day != null && (
              <span className="font-mono text-xs text-leather/70">
                Day {event.narrative_day}
              </span>
            )}
            {event.narrative_time != null && (
              <span className="text-xs text-leather/70">
                {getTimeLabel(event.narrative_time) ?? event.narrative_time}
              </span>
            )}
            {event.gm_only && (
              <Badge
                variant="outline"
                className="border-leather/40 bg-leather/10 text-[11px] font-semibold text-leather"
              >
                GM Only
              </Badge>
            )}
          </div>
        </div>
        {isGm && (
          <div className="flex shrink-0 items-center gap-1 text-leather">
            {!event.resolved && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResolve}
                className="border-leather/40 bg-transparent text-leather hover:bg-leather/10 hover:text-leather"
              >
                <CheckCircle className="size-4 mr-1" />
                Resolve
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setEditing(!editing)}
              className="text-leather hover:bg-leather/10 hover:text-leather"
            >
              <Pencil className="size-4" />
            </Button>
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
                  <DialogTitle>Delete this event?</DialogTitle>
                  <DialogDescription>
                    This will archive the event. All data is preserved.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
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

      {/* Edit Mode */}
      {editing && isGm ? (
        <BookCard>
          <BookCardHeader>
            <BookCardTitle>Edit Event</BookCardTitle>
          </BookCardHeader>
          <BookCardContent className="space-y-4 [&_label]:text-leather">
            <div className="space-y-2">
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-summary">Summary</Label>
              <Input
                id="edit-summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={eventType}
                  onValueChange={(v) => setEventType(v ?? "general")}
                >
                  <SelectTrigger>
                    <SelectValue>{eventType}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-weight">Weight (1-7)</Label>
                <Input
                  id="edit-weight"
                  type="number"
                  min={1}
                  max={7}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-day">Narrative Day</Label>
                <Input
                  id="edit-day"
                  type="number"
                  value={narrativeDay}
                  onChange={(e) => setNarrativeDay(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Time of Day</Label>
                <Select
                  value={narrativeTime}
                  onValueChange={(v) => setNarrativeTime(v ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time...">
                      {narrativeTime
                        ? TIME_OPTIONS.find((t) => t.value === narrativeTime)
                            ?.label
                        : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-trigger">Trigger Condition</Label>
              <Input
                id="edit-trigger"
                value={triggerCondition}
                onChange={(e) => setTriggerCondition(e.target.value)}
                placeholder="When/if this should surface..."
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="gold-glow"
              >
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button
                variant="ghost"
                onClick={cancelEdit}
                className="text-leather hover:bg-leather/10 hover:text-leather"
              >
                Cancel
              </Button>
            </div>
          </BookCardContent>
        </BookCard>
      ) : (
        /* Read Mode */
        <div className="space-y-5">
          {/* Parent link */}
          {event.parent_id && (
            <BookCard
              className="cursor-pointer"
              onClick={() =>
                router.push(
                  `/campaign/${campaignId}/events?selected=${event.parent_id}`
                )
              }
            >
              <BookCardContent className="flex items-center gap-2 py-2 text-sm text-leather/70">
                <ChevronLeft className="size-3" />
                <span>Parent Event</span>
              </BookCardContent>
            </BookCard>
          )}

          <BookCard>
            <BookCardContent className="py-3">
              <p className="whitespace-pre-line text-sm font-lore text-leather">
                {event.content}
              </p>
            </BookCardContent>
          </BookCard>

          {event.trigger_condition && (
            <div className="flex items-center gap-2 text-sm text-leather/70">
              <AlertTriangle className="size-4 shrink-0 text-gold" />
              <span className="italic">Trigger: {event.trigger_condition}</span>
            </div>
          )}

          {/* Entity Tags */}
          <div>
            <div className="text-xs font-heading uppercase tracking-wider text-leather/70 mb-2">
              Tagged Entities
            </div>
            {event.entity_tags && event.entity_tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {event.entity_tags.map((tag, i) => (
                  <BookCard
                    key={i}
                    className="cursor-pointer inline-flex"
                    onClick={() => navigateToEntity(tag.entity_type, tag.entity_id)}
                  >
                    <BookCardContent className="py-1.5 px-3 flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className="border-leather/40 text-[10px] text-leather"
                      >
                        {tag.entity_type}
                      </Badge>
                      <span className="text-sm font-medium text-leather">
                        {tag.entity_name}
                      </span>
                      <Badge
                        variant="outline"
                        className="border-leather/40 bg-leather/10 text-[10px] text-leather"
                      >
                        {tag.role}
                      </Badge>
                    </BookCardContent>
                  </BookCard>
                ))}
              </div>
            ) : (
              <p className="text-sm italic text-leather/70">
                No entities tagged to this event.
              </p>
            )}
          </div>

          {/* Children / Sub-events */}
          {event.children_count != null && event.children_count > 0 && (
            <div>
              <div className="text-xs font-heading uppercase tracking-wider text-leather/70 mb-2">
                {event.children_count} sub-event
                {event.children_count !== 1 ? "s" : ""}
              </div>
            </div>
          )}

          {/* Actions */}
          {isGm && (
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setEditing(true)}
                className="border-leather/40 bg-transparent text-leather hover:bg-leather/10 hover:text-leather"
              >
                <Pencil className="size-4 mr-1.5" />
                Edit
              </Button>
              {(event.children_count != null && event.children_count > 0) ||
              event.parent_id == null ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-leather/40 bg-transparent text-leather hover:bg-leather/10 hover:text-leather"
                >
                  Add Sub-Event
                </Button>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
