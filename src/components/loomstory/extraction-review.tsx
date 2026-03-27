"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { ExtractionStepper } from "@/components/loomstory/extraction-stepper";
import {
  NpcCard,
  LocationCard,
  FactionCard,
  ItemCard,
  EventCard,
  ConversationCard,
} from "@/components/loomstory/extraction-cards";
import { SectionHeader } from "@/components/loomstory/section-header";
import {
  Users,
  MapPin,
  Shield,
  Sword,
  Scroll,
  MessageSquare,
  Check,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Save,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────

interface BaseItem {
  _accepted: boolean;
  [key: string]: unknown;
}

interface EntityOption {
  id: string;
  name: string;
  entity_type: string;
}

interface ExtractionData {
  entities: {
    new_npcs?: Record<string, unknown>[];
    new_locations?: Record<string, unknown>[];
    new_factions?: Record<string, unknown>[];
    new_items?: Record<string, unknown>[];
  };
  events: {
    events?: Record<string, unknown>[];
  };
  conversations: {
    conversations?: Record<string, unknown>[];
  };
}

interface ExtractionReviewProps {
  sessionId: string;
  campaignId: string;
  userId: string;
  data: ExtractionData;
  onCommitted: () => void;
  onBackToNotes?: () => void;
}

// ─── Helpers ────────────────────────────────────────────────

function addAccepted(items: Record<string, unknown>[]): BaseItem[] {
  return items.map((item) => ({ ...item, _accepted: true }));
}

// ─── Main Component ─────────────────────────────────────────

export function ExtractionReview({
  sessionId,
  campaignId,
  userId,
  data,
  onCommitted,
  onBackToNotes,
}: ExtractionReviewProps) {
  const [npcs, setNpcs] = useState<BaseItem[]>(
    addAccepted(data.entities.new_npcs ?? [])
  );
  const [locations, setLocations] = useState<BaseItem[]>(
    addAccepted(data.entities.new_locations ?? [])
  );
  const [factions, setFactions] = useState<BaseItem[]>(
    addAccepted(data.entities.new_factions ?? [])
  );
  const [items, setItems] = useState<BaseItem[]>(
    addAccepted(data.entities.new_items ?? [])
  );
  const [events, setEvents] = useState<BaseItem[]>(
    addAccepted(data.events.events ?? [])
  );
  const [conversations, setConversations] = useState<BaseItem[]>(
    addAccepted(data.conversations.conversations ?? [])
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [committedSteps, setCommittedSteps] = useState<Set<string>>(
    new Set()
  );
  const [knownEntities, setKnownEntities] = useState<EntityOption[]>([]);

  // Fetch known entities (for event tagging)
  const fetchEntities = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/entities`);
      const data = await res.json();
      const all: EntityOption[] = [
        ...(data.npcs ?? []).map((e: { id: string; name: string }) => ({
          ...e,
          entity_type: "npc",
        })),
        ...(data.locations ?? []).map((e: { id: string; name: string }) => ({
          ...e,
          entity_type: "location",
        })),
        ...(data.factions ?? []).map((e: { id: string; name: string }) => ({
          ...e,
          entity_type: "faction",
        })),
        ...(data.items ?? []).map((e: { id: string; name: string }) => ({
          ...e,
          entity_type: "item",
        })),
      ];
      setKnownEntities(all);
    } catch {
      // Fail silently
    }
  }, [campaignId]);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  // Build steps dynamically
  const steps = useMemo(() => {
    const s: {
      key: string;
      label: string;
      count: number;
      icon: React.ComponentType<{ className?: string }>;
    }[] = [];

    if (npcs.length > 0)
      s.push({ key: "npcs", label: "NPCs", count: npcs.filter((i) => i._accepted).length, icon: Users });
    if (locations.length > 0)
      s.push({ key: "locations", label: "Locations", count: locations.filter((i) => i._accepted).length, icon: MapPin });
    if (factions.length > 0)
      s.push({ key: "factions", label: "Factions", count: factions.filter((i) => i._accepted).length, icon: Shield });
    if (items.length > 0)
      s.push({ key: "items", label: "Items", count: items.filter((i) => i._accepted).length, icon: Sword });
    if (events.length > 0)
      s.push({ key: "events", label: "Events", count: events.filter((i) => i._accepted).length, icon: Scroll });
    if (conversations.length > 0)
      s.push({ key: "conversations", label: "Conversations", count: conversations.filter((i) => i._accepted).length, icon: MessageSquare });
    s.push({ key: "summary", label: "Summary", count: 0, icon: Check });

    return s;
  }, [npcs, locations, factions, items, events, conversations]);

  const currentStepKey = steps[currentStep]?.key;
  const isStepCommitted = committedSteps.has(currentStepKey);

  // Generic change/toggle
  function makeHandlers(
    state: BaseItem[],
    setter: React.Dispatch<React.SetStateAction<BaseItem[]>>
  ) {
    return {
      onChange: (index: number, key: string, value: unknown) => {
        setter((prev) => {
          const next = [...prev];
          next[index] = { ...next[index], [key]: value };
          return next;
        });
      },
      onToggle: (index: number) => {
        setter((prev) => {
          const next = [...prev];
          next[index] = { ...next[index], _accepted: !next[index]._accepted };
          return next;
        });
      },
    };
  }

  const npcHandlers = makeHandlers(npcs, setNpcs);
  const locationHandlers = makeHandlers(locations, setLocations);
  const factionHandlers = makeHandlers(factions, setFactions);
  const itemHandlers = makeHandlers(items, setItems);
  const eventHandlers = makeHandlers(events, setEvents);
  const conversationHandlers = makeHandlers(conversations, setConversations);

  // Per-step commit
  async function commitStep() {
    const stepKey = currentStepKey;
    const itemsMap: Record<string, BaseItem[]> = {
      npcs,
      locations,
      factions,
      items,
      events,
      conversations,
    };
    const stepItems = itemsMap[stepKey];

    if (!stepItems) return;

    const accepted = stepItems.filter((i) => i._accepted);
    if (accepted.length === 0) {
      toast.error("No items selected");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        `/api/session-process/${sessionId}/commit-step`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step: stepKey,
            items: accepted,
            campaign_id: campaignId,
            user_id: userId,
          }),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        toast.error("Failed to save", { description: result.error });
        setSaving(false);
        return;
      }

      toast.success(
        `Saved ${result.committed} ${stepKey} to knowledge base`
      );
      setCommittedSteps((prev) => new Set([...prev, stepKey]));

      // Refresh known entities so the events step has them
      await fetchEntities();

      // Auto-advance to next step
      if (currentStep < steps.length - 1) {
        setCurrentStep((s) => s + 1);
      }
    } catch {
      toast.error("Failed to save");
    }

    setSaving(false);
  }

  // Skip step
  function skipStep() {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  }

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <ExtractionStepper
        steps={steps}
        currentStep={currentStep}
        onStepClick={setCurrentStep}
      />

      {/* Step Content */}
      <div className="min-h-[200px] max-h-[60vh] overflow-y-auto pr-1">
        {currentStepKey === "npcs" && (
          <StepContent
            icon={Users}
            title="New NPCs"
            items={npcs}
            CardComponent={NpcCard}
            handlers={npcHandlers}
            committed={isStepCommitted}
          />
        )}

        {currentStepKey === "locations" && (
          <StepContent
            icon={MapPin}
            title="New Locations"
            items={locations}
            CardComponent={LocationCard}
            handlers={locationHandlers}
            committed={isStepCommitted}
          />
        )}

        {currentStepKey === "factions" && (
          <StepContent
            icon={Shield}
            title="New Factions"
            items={factions}
            CardComponent={FactionCard}
            handlers={factionHandlers}
            committed={isStepCommitted}
          />
        )}

        {currentStepKey === "items" && (
          <StepContent
            icon={Sword}
            title="New Items"
            items={items}
            CardComponent={ItemCard}
            handlers={itemHandlers}
            committed={isStepCommitted}
          />
        )}

        {currentStepKey === "events" && (
          <StepContent
            icon={Scroll}
            title="Events"
            items={events}
            CardComponent={(props) => (
              <EventCard {...props} entityOptions={knownEntities} />
            )}
            handlers={eventHandlers}
            committed={isStepCommitted}
          />
        )}

        {currentStepKey === "conversations" && (
          <StepContent
            icon={MessageSquare}
            title="Conversations"
            items={conversations}
            CardComponent={ConversationCard}
            handlers={conversationHandlers}
            committed={isStepCommitted}
          />
        )}

        {currentStepKey === "summary" && (
          <div className="space-y-4">
            <SectionHeader>Extraction Complete</SectionHeader>
            <Card className="grain">
              <CardContent className="py-6 space-y-3">
                <p className="text-sm font-lore text-muted-foreground">
                  All extraction steps have been reviewed.
                </p>
                <div className="flex flex-wrap gap-2">
                  {Array.from(committedSteps).map((step) => (
                    <Badge key={step} variant="default" className="text-xs">
                      <Check className="size-3 mr-1" />
                      {step}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Button
              className="gold-glow font-heading w-full"
              onClick={onCommitted}
              size="lg"
            >
              <Check className="size-4 mr-1.5" />
              Done — Return to Session
            </Button>
          </div>
        )}
      </div>

      {/* Navigation */}
      {currentStepKey !== "summary" && (
        <div className="flex items-center justify-between pt-2 border-t border-border">
          {currentStep === 0 && onBackToNotes ? (
            <Button variant="ghost" onClick={onBackToNotes}>
              <ChevronLeft className="size-4 mr-1" />
              Edit Notes
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="size-4 mr-1" />
              Previous
            </Button>
          )}

          <span className="text-xs text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </span>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={skipStep}>
              Skip
              <ChevronRight className="size-4 ml-1" />
            </Button>
            {!isStepCommitted ? (
              <Button
                className="gold-glow font-heading"
                onClick={commitStep}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <RefreshCw className="size-4 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="size-4 mr-1.5" />
                    Save {currentStepKey}
                  </>
                )}
              </Button>
            ) : (
              <Badge variant="default" className="text-xs py-1.5 px-3">
                <Check className="size-3 mr-1" />
                Saved
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step Content Wrapper ───────────────────────────────────

function StepContent({
  icon: Icon,
  title,
  items,
  CardComponent,
  handlers,
  committed,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: BaseItem[];
  CardComponent: React.ComponentType<{
    item: BaseItem;
    index: number;
    onChange: (index: number, key: string, value: unknown) => void;
    onToggle: (index: number) => void;
  }>;
  handlers: {
    onChange: (index: number, key: string, value: unknown) => void;
    onToggle: (index: number) => void;
  };
  committed: boolean;
}) {
  const accepted = items.filter((i) => i._accepted).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <SectionHeader className="flex items-center gap-2 mb-0">
          <Icon className="size-4 text-gold" />
          {title}
        </SectionHeader>
        <Badge variant="outline" className="text-xs">
          {accepted}/{items.length} selected
        </Badge>
        {committed && (
          <Badge variant="default" className="text-xs">
            <Check className="size-3 mr-1" />
            Saved
          </Badge>
        )}
      </div>
      <div className="space-y-3">
        {items.map((item, i) => (
          <CardComponent
            key={i}
            item={item}
            index={i}
            onChange={handlers.onChange}
            onToggle={handlers.onToggle}
          />
        ))}
      </div>
    </div>
  );
}
