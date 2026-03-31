"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  Scroll,
  Map,
  Users,
  Swords,
  GitBranch,
  FileText,
  Sparkles,
  Pencil,
  Save,
  RefreshCw,
  Loader2,
  ShieldAlert,
} from "lucide-react";

// ─── Tool definitions ─────────────────────────────────────

interface PrepTool {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  inputType: "none" | "textarea" | "location";
  inputPlaceholder?: string;
}

const PREP_TOOLS: PrepTool[] = [
  {
    id: "unresolved",
    label: "Unresolved",
    description:
      "Summarize all open promises, todos, and upcoming triggers that haven't been resolved yet.",
    icon: Scroll,
    inputType: "none",
  },
  {
    id: "planner",
    label: "Session Planner",
    description:
      "Describe your ideas and get a scene-by-scene structure based on active plot threads and open events.",
    icon: FileText,
    inputType: "textarea",
    inputPlaceholder:
      "What are you thinking for the next session? Describe your ideas, themes, or scenes you want to include...",
  },
  {
    id: "hooks",
    label: "Plot Hooks",
    description:
      "Generate hooks to reintroduce or surface unresolved plot threads and events.",
    icon: GitBranch,
    inputType: "none",
  },
  {
    id: "npc-encounter",
    label: "NPC Encounter",
    description:
      "Describe a scene and get NPC motivations, behaviors, and dialogue suggestions based on their event history.",
    icon: Users,
    inputType: "textarea",
    inputPlaceholder:
      "Describe the scene where NPCs will appear... (e.g., The party visits the Silver Hart tavern looking for information)",
  },
  {
    id: "encounter",
    label: "Encounter Builder",
    description:
      "Describe an encounter and get a full draft with enemies, stakes, consequences, and environmental details.",
    icon: Swords,
    inputType: "textarea",
    inputPlaceholder:
      "Describe the encounter... (e.g., Ambush on the mountain road by Crimson Hand agents)",
  },
  {
    id: "location-dressing",
    label: "Location Dressing",
    description:
      "Pick a location and get atmosphere, sensory details, points of interest, and encounter suggestions.",
    icon: Map,
    inputType: "location",
  },
  {
    id: "outline",
    label: "Session Outline",
    description:
      "Generate a full session outline with opening scene, encounters, decision points, NPC cheat sheet, and fallback plans.",
    icon: Sparkles,
    inputType: "textarea",
    inputPlaceholder:
      "What's the theme or main idea for this session? What do you want to accomplish?",
  },
];

// ─── Types ────────────────────────────────────────────────

interface Session {
  id: string;
  title: string;
  session_number: number | null;
}

interface Location {
  id: string;
  name: string;
}

interface SessionPrepProps {
  campaignId: string;
  campaignName: string;
  userId: string;
  role: string;
  sessions: Session[];
}

// ─── Component ────────────────────────────────────────────

export function SessionPrep({
  campaignId,
  campaignName,
  userId,
  role,
  sessions,
}: SessionPrepProps) {
  const router = useRouter();
  const isGm = role === "gm";

  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [locationId, setLocationId] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [output, setOutput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [saveSessionId, setSaveSessionId] = useState(sessions[0]?.id ?? "");
  const [saving, setSaving] = useState(false);

  if (!isGm) {
    return (
      <div className="text-center py-12">
        <ShieldAlert className="size-12 text-rune mx-auto mb-4" />
        <p className="text-muted-foreground font-lore">
          Session prep tools are GM only.
        </p>
      </div>
    );
  }

  const currentTool = PREP_TOOLS.find((t) => t.id === activeTool);

  function selectTool(toolId: string) {
    setActiveTool(toolId);
    setInputText("");
    setLocationId("");
    setOutput("");
    setEditing(false);
    setEditText("");

    // Fetch locations for location-dressing tool
    if (toolId === "location-dressing" && locations.length === 0) {
      fetchLocations();
    }
  }

  async function fetchLocations() {
    const supabase = createClient();
    const { data } = await supabase
      .from("locations")
      .select("id, name")
      .eq("campaign_id", campaignId)
      .is("deleted_at", null)
      .order("name");
    setLocations(data ?? []);
  }

  async function handleGenerate() {
    if (!activeTool) return;
    setGenerating(true);
    setOutput("");
    setEditing(false);

    try {
      const body: Record<string, unknown> = {
        campaign_id: campaignId,
        user_id: userId,
        tool: activeTool,
      };

      // Build input based on tool type
      if (currentTool?.inputType === "textarea" && inputText.trim()) {
        body.input = { description: inputText };
      } else if (
        currentTool?.inputType === "location" &&
        locationId
      ) {
        body.input = { location_id: locationId };
      }

      const res = await fetch("/api/session-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error("Failed to generate", {
          description: err.error ?? "Unknown error",
        });
        setGenerating(false);
        return;
      }

      const data = await res.json();
      setOutput(data.content);
      setEditText(data.content);
    } catch {
      toast.error("Failed to generate", {
        description: "Network error — please try again",
      });
    }

    setGenerating(false);
  }

  async function handleSave() {
    if (!saveSessionId || !output) return;
    setSaving(true);

    const supabase = createClient();
    const contentToSave = editing ? editText : output;

    // Fetch existing gm_notes to append
    const { data: session } = await supabase
      .from("sessions")
      .select("gm_notes")
      .eq("id", saveSessionId)
      .single();

    const existing = session?.gm_notes ?? "";
    const separator = existing ? "\n\n---\n\n" : "";
    const toolLabel =
      PREP_TOOLS.find((t) => t.id === activeTool)?.label ?? "Prep";
    const newNotes = `${existing}${separator}## ${toolLabel}\n\n${contentToSave}`;

    const { error } = await supabase
      .from("sessions")
      .update({ gm_notes: newNotes })
      .eq("id", saveSessionId);

    if (error) {
      toast.error("Failed to save", { description: error.message });
    } else {
      toast.success("Saved to session GM notes");
    }
    setSaving(false);
  }

  const canGenerate =
    activeTool &&
    !generating &&
    (currentTool?.inputType === "none" ||
      (currentTool?.inputType === "textarea" && inputText.trim()) ||
      (currentTool?.inputType === "location" && locationId));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push(`/campaign/${campaignId}`)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
        >
          <ChevronLeft className="size-4" />
          {campaignName}
        </button>
        <h2 className="text-2xl font-heading font-semibold">Session Prep</h2>
        <p className="text-sm text-muted-foreground mt-1">
          AI-powered tools to prepare your next session.
        </p>
      </div>

      {/* Tool Picker */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PREP_TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <Card
              key={tool.id}
              className={`grain cursor-pointer transition-all ${
                isActive
                  ? "ring-2 ring-gold/50 bg-gold/5"
                  : "gold-glow"
              }`}
              onClick={() => selectTool(tool.id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading flex items-center gap-2">
                  <Icon className="size-4 text-gold" />
                  {tool.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {tool.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active Tool */}
      {currentTool && (
        <Card className="grain">
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <currentTool.icon className="size-5 text-gold" />
              {currentTool.label}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {currentTool.description}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Input */}
            {currentTool.inputType === "textarea" && (
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={currentTool.inputPlaceholder}
                rows={4}
              />
            )}
            {currentTool.inputType === "location" && (
              <Select
                value={locationId}
                onValueChange={(v) => setLocationId(v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a location..." />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="gold-glow font-heading"
            >
              {generating ? (
                <>
                  <Loader2 className="size-4 mr-1.5 animate-spin" />
                  Generating...
                </>
              ) : output ? (
                <>
                  <RefreshCw className="size-4 mr-1.5" />
                  Regenerate
                </>
              ) : (
                <>
                  <Sparkles className="size-4 mr-1.5" />
                  Generate
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Output */}
      {output && (
        <Card className="grain">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-heading text-base">
                Generated Content
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditing(!editing);
                    if (!editing) setEditText(output);
                  }}
                >
                  <Pencil className="size-3 mr-1" />
                  {editing ? "Preview" : "Edit"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={20}
                className="font-mono text-sm"
              />
            ) : (
              <div className="prose-fantasy text-sm whitespace-pre-wrap">
                {output}
              </div>
            )}

            {/* Save to session */}
            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <Select
                value={saveSessionId}
                onValueChange={(v) => setSaveSessionId(v ?? "")}
              >
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Select session...">
                    {sessions.find((s) => s.id === saveSessionId)
                      ?.title ?? "Select session..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.session_number ? `#${s.session_number} ` : ""}
                      {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleSave}
                disabled={saving || !saveSessionId}
                className="gold-glow font-heading"
              >
                <Save className="size-4 mr-1.5" />
                {saving ? "Saving..." : "Save to GM Notes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
