"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const EVENT_TYPES = [
  "general", "scene", "decision", "discovery", "conversation",
  "promise", "todo", "upcoming", "milestone", "mood", "quote",
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

interface Session {
  id: string;
  title: string;
  session_number: number | null;
}

interface EventCreateProps {
  campaignId: string;
  userId: string;
  sessions: Session[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function EventCreate({
  campaignId,
  userId,
  sessions,
  open,
  onOpenChange,
  onCreated,
}: EventCreateProps) {
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [eventType, setEventType] = useState("general");
  const [weight, setWeight] = useState("3");
  const [narrativeDay, setNarrativeDay] = useState("");
  const [narrativeTime, setNarrativeTime] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [triggerCondition, setTriggerCondition] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("campaign_events")
      .insert({
        campaign_id: campaignId,
        session_id: sessionId || null,
        content,
        summary: summary || null,
        event_type: eventType,
        weight: parseInt(weight) || 3,
        narrative_day: narrativeDay ? parseInt(narrativeDay) : null,
        narrative_time: narrativeTime ? parseInt(narrativeTime) : null,
        trigger_condition: triggerCondition || null,
        resolved: false,
        gm_only: true,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create event", { description: error.message });
      setCreating(false);
      return;
    }

    toast.success("Event created");
    setContent("");
    setSummary("");
    setEventType("general");
    setWeight("3");
    setNarrativeDay("");
    setNarrativeTime("");
    setSessionId("");
    setTriggerCondition("");
    setCreating(false);
    onOpenChange(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-heading">New Event</DialogTitle>
            <DialogDescription>
              Manually record a campaign event.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label htmlFor="evt-content">Content</Label>
              <Textarea
                id="evt-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What happened? Write as if someone will read this months from now..."
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="evt-summary">Summary</Label>
              <Input
                id="evt-summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="One-sentence summary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={eventType} onValueChange={(v) => setEventType(v ?? "general")}>
                  <SelectTrigger>
                    <SelectValue>{eventType}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="evt-weight">Weight (1-7)</Label>
                <Input
                  id="evt-weight"
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
                <Label htmlFor="evt-day">Narrative Day</Label>
                <Input
                  id="evt-day"
                  type="number"
                  value={narrativeDay}
                  onChange={(e) => setNarrativeDay(e.target.value)}
                  placeholder="Day 1 = campaign start"
                />
              </div>

              <div className="space-y-2">
                <Label>Time of Day</Label>
                <Select value={narrativeTime} onValueChange={(v) => setNarrativeTime(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time...">
                      {narrativeTime ? TIME_OPTIONS.find((t) => t.value === narrativeTime)?.label : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Session</Label>
              <Select value={sessionId} onValueChange={(v) => setSessionId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Link to session (optional)">
                    {sessionId ? sessions.find((s) => s.id === sessionId)?.title : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.session_number ? `#${s.session_number} ` : ""}{s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="evt-trigger">Trigger Condition</Label>
              <Input
                id="evt-trigger"
                value={triggerCondition}
                onChange={(e) => setTriggerCondition(e.target.value)}
                placeholder="When/if this should surface (for promises, todos, upcoming)"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={creating || !content.trim()} className="gold-glow">
              {creating ? "Creating..." : "Create Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
