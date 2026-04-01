"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SectionHeader } from "@/components/loomstory/section-header";
import { ChevronLeft, Save, Heart } from "lucide-react";
import type { Section, Field, StorageBinding } from "@/types/system-template";

// ─── Types ──────────────────────────────────────────────────

interface CharacterData {
  id: string;
  campaign_id: string;
  name: string;
  level: number;
  experience: number;
  hp_current: number | null;
  hp_max: number | null;
  system_id: string;
  user_id: string | null;
  portrait_url: string | null;
  gm_notes: string | null;
  data: Record<string, unknown>;
}

interface StatRow {
  id: string;
  stat_key: string;
  value: number;
  data: Record<string, unknown>;
}

interface ResourceRow {
  id: string;
  resource_key: string;
  label: string | null;
  current_value: number;
  max_value: number | null;
  recharge_on: string | null;
  data: Record<string, unknown>;
}

interface NoteRow {
  id: string;
  note_key: string;
  content: string;
  is_public: boolean;
  order_index: number;
}

interface CharacterSheetProps {
  character: CharacterData;
  campaignId: string;
  campaignName: string;
  role: string;
  userId: string;
  template: Section[];
  stats: StatRow[];
  abilities: unknown[];
  resources: ResourceRow[];
  items: unknown[];
  notes: NoteRow[];
  conditions: unknown[];
}

// ─── Helpers ────────────────────────────────────────────────

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const copy = { ...obj };
  const parts = path.split(".");
  let current: Record<string, unknown> = copy;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] == null || typeof current[part] !== "object") {
      current[part] = {};
    }
    current[part] = { ...(current[part] as Record<string, unknown>) };
    current = current[part] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
  return copy;
}

// ─── Component ──────────────────────────────────────────────

export function CharacterSheet({
  character: initialCharacter,
  campaignId,
  campaignName,
  role,
  userId,
  template,
  stats: initialStats,
  resources: initialResources,
  notes: initialNotes,
}: CharacterSheetProps) {
  const router = useRouter();
  const isGm = role === "gm";
  const isOwner = initialCharacter.user_id === userId;
  const canEdit = isGm || isOwner;

  // Mutable state
  const [character, setCharacter] = useState(initialCharacter);
  const [charData, setCharData] = useState<Record<string, unknown>>(initialCharacter.data ?? {});
  const [stats, setStats] = useState<Record<string, { value: number; data: Record<string, unknown> }>>(
    Object.fromEntries(initialStats.map((s) => [s.stat_key, { value: s.value, data: s.data ?? {} }]))
  );
  const [resources, setResources] = useState<Record<string, { current: number; max: number | null }>>(
    Object.fromEntries(initialResources.map((r) => [r.resource_key, { current: r.current_value, max: r.max_value }]))
  );
  const [noteValues, setNoteValues] = useState<Record<string, string>>(
    Object.fromEntries(initialNotes.map((n) => [n.note_key, n.content]))
  );
  const [gmNotes, setGmNotes] = useState(initialCharacter.gm_notes ?? "");
  const [saving, setSaving] = useState(false);

  // ─── Resolve field value ──────────────────────────────────

  const resolveValue = useCallback((storage: StorageBinding): unknown => {
    switch (storage.target) {
      case "core":
        if (storage.column === "hp_current") return character.hp_current;
        if (storage.column === "hp_max") return character.hp_max;
        if (storage.column === "level") return character.level;
        if (storage.column === "experience") return character.experience;
        if (storage.column === "name") return character.name;
        return null;
      case "data":
        return getNestedValue(charData, storage.path);
      case "stat":
        return stats[storage.stat_key]?.value ?? "";
      case "resource":
        return resources[storage.resource_key]?.current ?? 0;
      case "note":
        return noteValues[storage.note_key] ?? "";
      default:
        return undefined;
    }
  }, [character, charData, stats, resources, noteValues]);

  // ─── Update field value ───────────────────────────────────

  const updateValue = useCallback((storage: StorageBinding, value: unknown) => {
    switch (storage.target) {
      case "core":
        setCharacter((prev) => ({ ...prev, [storage.column]: value }));
        break;
      case "data":
        setCharData((prev) => setNestedValue(prev, storage.path, value));
        break;
      case "stat":
        setStats((prev) => ({
          ...prev,
          [storage.stat_key]: {
            ...(prev[storage.stat_key] ?? { data: {} }),
            value: Number(value) || 0,
          },
        }));
        break;
      case "resource":
        setResources((prev) => ({
          ...prev,
          [storage.resource_key]: {
            ...(prev[storage.resource_key] ?? { max: null }),
            current: Number(value) || 0,
          },
        }));
        break;
      case "note":
        setNoteValues((prev) => ({ ...prev, [storage.note_key]: String(value) }));
        break;
    }
  }, []);

  // ─── Save ─────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    try {
      // Save core + data
      const { error: charError } = await supabase
        .from("characters")
        .update({
          name: character.name,
          level: character.level,
          experience: character.experience,
          hp_current: character.hp_current,
          hp_max: character.hp_max,
          data: charData,
          gm_notes: isGm ? gmNotes || null : undefined,
          updated_by: user?.id,
        })
        .eq("id", character.id);

      if (charError) throw charError;

      // Save stats (upsert each)
      for (const [statKey, statVal] of Object.entries(stats)) {
        const { error } = await supabase
          .from("character_stats")
          .upsert(
            { character_id: character.id, stat_key: statKey, value: statVal.value, data: statVal.data },
            { onConflict: "character_id,stat_key" }
          );
        if (error) throw error;
      }

      // Save resources (upsert each)
      for (const [resKey, resVal] of Object.entries(resources)) {
        const { error } = await supabase
          .from("character_resources")
          .upsert(
            { character_id: character.id, resource_key: resKey, current_value: resVal.current, max_value: resVal.max },
            { onConflict: "character_id,resource_key" }
          );
        if (error) throw error;
      }

      // Save notes (upsert each)
      for (const [noteKey, noteContent] of Object.entries(noteValues)) {
        if (!noteContent) continue;
        const { error } = await supabase
          .from("character_notes")
          .upsert(
            { character_id: character.id, note_key: noteKey, content: noteContent, order_index: 0 },
            { onConflict: "character_id,note_key" }
          );
        if (error) throw error;
      }

      toast.success("Character saved");
    } catch (err) {
      toast.error("Failed to save character", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  }

  // ─── Field Renderer ───────────────────────────────────────

  function renderField(field: Field) {
    if (field.type === "hidden") return null;
    if (field.computed) return null; // Skip computed fields for freeform

    // Table-backed bindings show a placeholder
    if (
      field.storage.target === "abilities" ||
      field.storage.target === "items" ||
      field.storage.target === "conditions" ||
      field.storage.target === "classes"
    ) {
      return (
        <div key={field.key} className="text-sm text-muted-foreground italic">
          {field.label} — managed in a future update
        </div>
      );
    }

    // Stat group shows a placeholder
    if (field.storage.target === "stat_group" || field.storage.target === "resource_group") {
      return (
        <div key={field.key} className="text-sm text-muted-foreground italic">
          {field.label} — managed in a future update
        </div>
      );
    }

    const value = resolveValue(field.storage);
    const onChange = (v: unknown) => updateValue(field.storage, v);

    switch (field.type) {
      case "number":
      case "stat_block":
        return (
          <div key={field.key} className="space-y-1">
            <Label className="text-xs text-muted-foreground">{field.label}</Label>
            <Input
              type="number"
              value={value != null ? String(value) : ""}
              onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
              min={field.min}
              max={field.max}
              disabled={!canEdit}
              className="font-mono"
            />
            {field.type === "stat_block" && field.storage.target === "stat" && stats[field.storage.stat_key]?.data?.modifier != null && (
              <span className="text-xs text-gold font-mono">
                Modifier: {(stats[field.storage.stat_key].data.modifier as number) >= 0 ? "+" : ""}
                {stats[field.storage.stat_key].data.modifier as number}
              </span>
            )}
          </div>
        );

      case "text":
        return (
          <div key={field.key} className="space-y-1">
            <Label className="text-xs text-muted-foreground">{field.label}</Label>
            <Input
              value={String(value ?? "")}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder}
              disabled={!canEdit}
            />
          </div>
        );

      case "textarea":
      case "richtext":
        return (
          <div key={field.key} className="space-y-1">
            <Label className="text-xs text-muted-foreground">{field.label}</Label>
            <Textarea
              value={String(value ?? "")}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder}
              disabled={!canEdit}
              rows={3}
            />
            {field.help_text && (
              <p className="text-xs text-muted-foreground">{field.help_text}</p>
            )}
          </div>
        );

      case "boolean":
        return (
          <div key={field.key} className="flex items-center gap-2">
            <Checkbox
              checked={!!value}
              onCheckedChange={(checked) => onChange(checked)}
              disabled={!canEdit}
            />
            <Label className="text-sm">{field.label}</Label>
          </div>
        );

      case "select":
        return (
          <div key={field.key} className="space-y-1">
            <Label className="text-xs text-muted-foreground">{field.label}</Label>
            <Select
              value={String(value ?? "")}
              onValueChange={(v) => onChange(v ?? "")}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {(field.options ?? []).map((opt) => (
                  <SelectItem key={String(opt.value)} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "resource_bar":
      case "slot_tracker": {
        if (field.storage.target !== "resource") return null;
        const resKey = field.storage.resource_key;
        return (
          <div key={field.key} className="space-y-1">
            <Label className="text-xs text-muted-foreground">{field.label}</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={String(resources[resKey]?.current ?? 0)}
                onChange={(e) => {
                  setResources((prev) => ({
                    ...prev,
                    [resKey]: {
                      ...(prev[resKey] ?? { max: null }),
                      current: Number(e.target.value) || 0,
                    },
                  }));
                }}
                disabled={!canEdit}
                className="w-20 font-mono"
              />
              <span className="text-muted-foreground">/</span>
              <Input
                type="number"
                value={String(resources[resKey]?.max ?? "")}
                onChange={(e) => {
                  setResources((prev) => ({
                    ...prev,
                    [resKey]: {
                      ...(prev[resKey] ?? { current: 0 }),
                      max: e.target.value === "" ? null : Number(e.target.value),
                    },
                  }));
                }}
                disabled={!canEdit}
                className="w-20 font-mono"
              />
            </div>
          </div>
        );
      }

      case "tag_list":
        return (
          <div key={field.key} className="space-y-1">
            <Label className="text-xs text-muted-foreground">{field.label}</Label>
            <Input
              value={String(value ?? "")}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Comma-separated values"
              disabled={!canEdit}
            />
          </div>
        );

      case "currency":
        return (
          <div key={field.key} className="space-y-1">
            <Label className="text-xs text-muted-foreground">{field.label}</Label>
            <Input
              value={typeof value === "object" ? JSON.stringify(value) : String(value ?? "")}
              onChange={(e) => {
                try { onChange(JSON.parse(e.target.value)); } catch { onChange(e.target.value); }
              }}
              placeholder='{"gp": 0, "sp": 0}'
              disabled={!canEdit}
              className="font-mono text-xs"
            />
          </div>
        );

      case "rank":
        return (
          <div key={field.key} className="space-y-1">
            <Label className="text-xs text-muted-foreground">{field.label}</Label>
            <Select
              value={String(value ?? "")}
              onValueChange={(v) => onChange(v ?? "")}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select rank" />
              </SelectTrigger>
              <SelectContent>
                {(field.options ?? []).map((opt) => (
                  <SelectItem key={String(opt.value)} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      default:
        return (
          <div key={field.key} className="space-y-1">
            <Label className="text-xs text-muted-foreground">{field.label}</Label>
            <Input
              value={String(value ?? "")}
              onChange={(e) => onChange(e.target.value)}
              disabled={!canEdit}
            />
          </div>
        );
    }
  }

  // ─── Render ───────────────────────────────────────────────

  const hpPercent = character.hp_max ? ((character.hp_current ?? 0) / character.hp_max) * 100 : 0;

  return (
    <div className="max-w-4xl">
      {/* Back nav */}
      <button
        onClick={() => router.push(`/campaign/${campaignId}/characters`)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ChevronLeft className="size-4" />
        {campaignName}
      </button>

      {/* Character Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-heading font-semibold">{character.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">Level {character.level}</Badge>
            {character.hp_max != null && (
              <div className="flex items-center gap-1 text-sm">
                <Heart className={`size-3.5 ${hpPercent > 50 ? "text-emerald-500" : hpPercent > 25 ? "text-amber-500" : "text-destructive"}`} />
                <span className="font-mono text-xs">{character.hp_current}/{character.hp_max}</span>
              </div>
            )}
          </div>
        </div>
        {canEdit && (
          <Button onClick={handleSave} disabled={saving} className="gold-glow font-heading">
            <Save className="size-4 mr-1.5" />
            {saving ? "Saving..." : "Save"}
          </Button>
        )}
      </div>

      {/* Template-driven sections */}
      {template.length > 0 ? (
        <div className="space-y-6">
          {template
            .sort((a, b) => a.order - b.order)
            .map((section) => (
            <Card key={section.key} className="grain">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading">{section.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={
                  section.layout === "grid"
                    ? `grid gap-4 ${section.columns === 6 ? "grid-cols-3 sm:grid-cols-6" : section.columns === 4 ? "grid-cols-2 sm:grid-cols-4" : section.columns === 3 ? "grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`
                    : "space-y-3"
                }>
                  {section.fields
                    .sort((a, b) => a.order - b.order)
                    .map((field) => renderField(field))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="grain">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground font-lore">
              No character sheet template available for this system.
              Fill in the basic fields above.
            </p>
          </CardContent>
        </Card>
      )}

      {/* GM Notes (always at bottom, GM only) */}
      {isGm && (
        <Card className="grain mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading">GM Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={gmNotes}
              onChange={(e) => setGmNotes(e.target.value)}
              placeholder="Private notes about this character..."
              rows={4}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
