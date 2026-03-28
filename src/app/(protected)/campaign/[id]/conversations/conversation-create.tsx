"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, X, MessageSquare } from "lucide-react";

interface KnownEntity {
  id: string;
  name: string;
  entity_type: string;
}

interface Turn {
  speaker: string;
  text: string;
  tone: string;
}

const TONE_OPTIONS = [
  "neutral", "friendly", "hostile", "nervous", "defensive",
  "pleading", "commanding", "sarcastic", "whispering", "shouting",
  "confident", "suspicious", "persuasive",
];

interface ConversationCreateProps {
  campaignId: string;
  userId: string;
  knownEntities: KnownEntity[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function ConversationCreate({
  campaignId,
  userId,
  knownEntities,
  open,
  onOpenChange,
  onCreated,
}: ConversationCreateProps) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [participants, setParticipants] = useState<KnownEntity[]>([]);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [creating, setCreating] = useState(false);
  const [addingParticipant, setAddingParticipant] = useState(false);

  function addParticipant(entity: KnownEntity) {
    if (participants.some((p) => p.id === entity.id)) return;
    setParticipants((prev) => [...prev, entity]);
    setAddingParticipant(false);
  }

  function removeParticipant(entityId: string) {
    setParticipants((prev) => prev.filter((p) => p.id !== entityId));
  }

  function addTurn() {
    setTurns((prev) => [...prev, { speaker: "", text: "", tone: "neutral" }]);
  }

  function updateTurn(index: number, field: keyof Turn, value: string) {
    setTurns((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function removeTurn(index: number) {
    setTurns((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    const contentPlain = turns
      .map((t) => `${t.speaker}: ${t.text}`)
      .join("\n");

    const supabase = createClient();
    const { error } = await supabase
      .from("conversation_logs")
      .insert({
        campaign_id: campaignId,
        title,
        participants: participants.map((p) => ({
          entity_id: p.id,
          entity_type: p.entity_type,
          name: p.name,
        })),
        content: turns,
        content_plain: contentPlain || null,
        gm_only: true,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create conversation", { description: error.message });
      setCreating(false);
      return;
    }

    toast.success("Conversation created");
    setTitle("");
    setSummary("");
    setParticipants([]);
    setTurns([]);
    setCreating(false);
    onOpenChange(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-heading">
              <MessageSquare className="size-4 inline mr-1.5" />
              New Conversation
            </DialogTitle>
            <DialogDescription>
              Record a dialogue between characters and NPCs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label htmlFor="conv-title">Title</Label>
              <Input
                id="conv-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Gareth warns the party"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conv-summary">Summary</Label>
              <Input
                id="conv-summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief summary of the conversation outcome"
              />
            </div>

            {/* Participants */}
            <div className="space-y-2">
              <Label>Participants</Label>
              {participants.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {participants.map((p) => (
                    <Badge key={p.id} variant="secondary" className="text-xs gap-1">
                      {p.name}
                      <button type="button" onClick={() => removeParticipant(p.id)} className="ml-0.5 hover:text-red-400">
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              {addingParticipant ? (
                <Select
                  value=""
                  onValueChange={(v) => {
                    if (!v) return;
                    const entity = knownEntities.find((e) => e.id === v);
                    if (entity) addParticipant(entity);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select participant..." />
                  </SelectTrigger>
                  <SelectContent>
                    {knownEntities
                      .filter((e) => !participants.some((p) => p.id === e.id))
                      .map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          <span className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px] px-1">{e.entity_type}</Badge>
                            {e.name}
                          </span>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={() => setAddingParticipant(true)}>
                  <Plus className="size-3 mr-1" />
                  Add Participant
                </Button>
              )}
            </div>

            {/* Dialogue Turns */}
            <div className="space-y-2">
              <Label>Dialogue</Label>
              {turns.length > 0 && (
                <div className="space-y-3">
                  {turns.map((turn, i) => (
                    <div key={i} className="space-y-1.5 border-l-2 border-gold/30 pl-3">
                      <div className="flex items-center gap-2">
                        <Input
                          value={turn.speaker}
                          onChange={(e) => updateTurn(i, "speaker", e.target.value)}
                          placeholder="Speaker name"
                          className="flex-1"
                        />
                        <Select
                          value={turn.tone}
                          onValueChange={(v) => updateTurn(i, "tone", v ?? "neutral")}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue>{turn.tone}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {TONE_OPTIONS.map((t) => (
                              <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removeTurn(i)}
                          aria-label="Remove turn"
                        >
                          <X className="size-3" />
                        </Button>
                      </div>
                      <Input
                        value={turn.text}
                        onChange={(e) => updateTurn(i, "text", e.target.value)}
                        placeholder="What they said..."
                      />
                    </div>
                  ))}
                </div>
              )}
              <Button type="button" variant="outline" size="sm" onClick={addTurn}>
                <Plus className="size-3 mr-1" />
                Add Turn
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={creating || !title.trim()} className="gold-glow">
              {creating ? "Creating..." : "Create Conversation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
