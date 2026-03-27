"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, X } from "lucide-react";

// ─── Tags Input (stores raw text while typing, splits on blur) ──

function TagsInput({
  value,
  onChange,
  placeholder,
}: {
  value: unknown;
  onChange: (val: string[]) => void;
  placeholder?: string;
}) {
  const arrayVal = Array.isArray(value) ? (value as string[]) : [];
  const [text, setText] = useState(arrayVal.join(", "));

  function handleBlur() {
    const tags = text
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onChange(tags);
  }

  return (
    <Input
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={handleBlur}
      placeholder={placeholder}
    />
  );
}

// ─── Generic types ──────────────────────────────────────────

interface BaseItem {
  _accepted: boolean;
  source_excerpt?: string;
  [key: string]: unknown;
}

interface FieldDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "tags";
  options?: string[];
  placeholder?: string;
}

// ─── Generic editable card ──────────────────────────────────

function EditableCard<T extends BaseItem>({
  item,
  index,
  fields,
  summaryRender,
  onChange,
  onToggle,
}: {
  item: T;
  index: number;
  fields: FieldDef[];
  summaryRender: (item: T) => React.ReactNode;
  onChange: (index: number, key: string, value: unknown) => void;
  onToggle: (index: number) => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <Card
      className={`grain transition-opacity ${item._accepted ? "" : "opacity-40"}`}
    >
      <CardContent className="py-3">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={item._accepted}
            onCheckedChange={() => onToggle(index)}
            className="mt-1 shrink-0"
          />
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-3">
                {fields.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      {field.label}
                    </Label>
                    {field.type === "text" && (
                      <Input
                        value={String(item[field.key] ?? "")}
                        onChange={(e) =>
                          onChange(index, field.key, e.target.value)
                        }
                        placeholder={field.placeholder}
                      />
                    )}
                    {field.type === "textarea" && (
                      <Textarea
                        value={String(item[field.key] ?? "")}
                        onChange={(e) =>
                          onChange(index, field.key, e.target.value)
                        }
                        placeholder={field.placeholder}
                        rows={2}
                      />
                    )}
                    {field.type === "number" && (
                      <Input
                        type="number"
                        value={String(item[field.key] ?? "")}
                        onChange={(e) =>
                          onChange(
                            index,
                            field.key,
                            e.target.value
                              ? parseInt(e.target.value)
                              : null
                          )
                        }
                        placeholder={field.placeholder}
                      />
                    )}
                    {field.type === "select" && field.options && (
                      <Select
                        value={String(item[field.key] ?? "")}
                        onValueChange={(v) =>
                          onChange(index, field.key, v ?? "")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={field.placeholder}>
                            {String(item[field.key] ?? "") || undefined}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {field.options.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {field.type === "tags" && (
                      <TagsInput
                        value={item[field.key]}
                        onChange={(val) => onChange(index, field.key, val)}
                        placeholder={field.placeholder ?? "tag1, tag2, tag3"}
                      />
                    )}
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(false)}
                >
                  <X className="size-3.5 mr-1" />
                  Done
                </Button>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">{summaryRender(item)}</div>
                {item._accepted && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setEditing(true)}
                    className="shrink-0"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        {!editing && item.source_excerpt && (
          <p className="text-xs text-muted-foreground italic border-l-2 border-rune pl-2 ml-8 mt-2">
            &ldquo;{String(item.source_excerpt)}&rdquo;
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── NPC Card ───────────────────────────────────────────────

const NPC_FIELDS: FieldDef[] = [
  { key: "name", label: "Name", type: "text", placeholder: "NPC name" },
  { key: "aliases", label: "Aliases / Nicknames", type: "tags", placeholder: "nickname, title, short name..." },
  { key: "description", label: "Description", type: "textarea", placeholder: "Appearance, personality, notable traits..." },
  { key: "status", label: "Status", type: "select", options: ["alive", "dead", "unknown", "missing"] },
  { key: "tags", label: "Tags", type: "tags", placeholder: "merchant, ally, quest giver..." },
  { key: "gm_notes", label: "GM Notes", type: "textarea", placeholder: "Hidden info..." },
  { key: "player_notes", label: "Player Notes", type: "textarea", placeholder: "What the party knows..." },
];

export function NpcCard(props: {
  item: BaseItem;
  index: number;
  onChange: (index: number, key: string, value: unknown) => void;
  onToggle: (index: number) => void;
}) {
  return (
    <EditableCard
      fields={NPC_FIELDS}
      summaryRender={(item) => (
        <div>
          <div className="flex items-baseline gap-2">
            <p className="font-medium">{String(item.name ?? "Unnamed NPC")}</p>
            {Array.isArray(item.aliases) && (item.aliases as string[]).length > 0 && (
              <span className="text-xs text-muted-foreground italic">
                aka {(item.aliases as string[]).join(", ")}
              </span>
            )}
          </div>
          {item.description != null && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
              {String(item.description)}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-1.5">
            {item.status != null && (
              <Badge variant="outline" className="text-xs">
                {String(item.status)}
              </Badge>
            )}
            {Array.isArray(item.tags) &&
              (item.tags as string[]).slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
          </div>
        </div>
      )}
      {...props}
    />
  );
}

// ─── Location Card ──────────────────────────────────────────

const LOCATION_FIELDS: FieldDef[] = [
  { key: "name", label: "Name", type: "text", placeholder: "Location name" },
  { key: "aliases", label: "Aliases / Nicknames", type: "tags", placeholder: "short name, alternate name..." },
  { key: "description", label: "Description", type: "textarea", placeholder: "Atmosphere, notable features..." },
  { key: "type", label: "Type", type: "select", options: ["city", "town", "village", "dungeon", "wilderness", "building", "district", "region", "other"] },
  { key: "gm_notes", label: "GM Notes", type: "textarea", placeholder: "Hidden info..." },
  { key: "player_notes", label: "Player Notes", type: "textarea", placeholder: "What the party knows..." },
];

export function LocationCard(props: {
  item: BaseItem;
  index: number;
  onChange: (index: number, key: string, value: unknown) => void;
  onToggle: (index: number) => void;
}) {
  return (
    <EditableCard
      fields={LOCATION_FIELDS}
      summaryRender={(item) => (
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{String(item.name ?? "Unnamed Location")}</p>
            {item.type != null && (
              <Badge variant="outline" className="text-xs">
                {String(item.type)}
              </Badge>
            )}
          </div>
          {item.description != null && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
              {String(item.description)}
            </p>
          )}
        </div>
      )}
      {...props}
    />
  );
}

// ─── Faction Card ───────────────────────────────────────────

const FACTION_FIELDS: FieldDef[] = [
  { key: "name", label: "Name", type: "text", placeholder: "Faction name" },
  { key: "description", label: "Description", type: "textarea", placeholder: "Who they are, what they do..." },
  { key: "goals", label: "Goals", type: "textarea", placeholder: "What they want..." },
  { key: "gm_notes", label: "GM Notes", type: "textarea", placeholder: "Hidden info..." },
  { key: "player_notes", label: "Player Notes", type: "textarea", placeholder: "What the party knows..." },
];

export function FactionCard(props: {
  item: BaseItem;
  index: number;
  onChange: (index: number, key: string, value: unknown) => void;
  onToggle: (index: number) => void;
}) {
  return (
    <EditableCard
      fields={FACTION_FIELDS}
      summaryRender={(item) => (
        <div>
          <p className="font-medium">{String(item.name ?? "Unnamed Faction")}</p>
          {item.description != null && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
              {String(item.description)}
            </p>
          )}
        </div>
      )}
      {...props}
    />
  );
}

// ─── Item Card ──────────────────────────────────────────────

const ITEM_FIELDS: FieldDef[] = [
  { key: "name", label: "Name", type: "text", placeholder: "Item name" },
  { key: "description", label: "Description", type: "textarea", placeholder: "What it is, what it does..." },
  { key: "type", label: "Type", type: "select", options: ["weapon", "armor", "magical_item", "scroll", "grimoire", "potion", "quest_item", "tool", "gear", "trinket", "document", "currency", "other"] },
  { key: "mechanical_properties_text", label: "Mechanical Properties", type: "textarea", placeholder: "Damage, AC bonus, special abilities, charges... (will link to compendium later)" },
  { key: "gm_notes", label: "GM Notes", type: "textarea", placeholder: "Hidden properties, curses, history..." },
  { key: "player_notes", label: "Player Notes", type: "textarea", placeholder: "What the party knows..." },
];

export function ItemCard(props: {
  item: BaseItem;
  index: number;
  onChange: (index: number, key: string, value: unknown) => void;
  onToggle: (index: number) => void;
}) {
  return (
    <EditableCard
      fields={ITEM_FIELDS}
      summaryRender={(item) => (
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{String(item.name ?? "Unnamed Item")}</p>
            {item.type != null && (
              <Badge variant="outline" className="text-xs">
                {String(item.type)}
              </Badge>
            )}
          </div>
          {item.description != null && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
              {String(item.description)}
            </p>
          )}
        </div>
      )}
      {...props}
    />
  );
}

// ─── Event Card ─────────────────────────────────────────────

interface EntityOption {
  id: string;
  name: string;
  entity_type: string;
}

const EVENT_FIELDS: FieldDef[] = [
  { key: "content", label: "Content", type: "textarea", placeholder: "What happened..." },
  { key: "summary", label: "Summary", type: "text", placeholder: "One-sentence summary" },
  { key: "event_type", label: "Type", type: "select", options: ["general", "scene", "decision", "discovery", "conversation", "promise", "todo", "upcoming", "milestone", "mood", "quote"] },
  { key: "weight", label: "Weight (1-7)", type: "number", placeholder: "3" },
  { key: "narrative_day", label: "Narrative Day", type: "number", placeholder: "Day 1 = campaign start, negative for prehistory" },
  { key: "narrative_time", label: "Time of Day", type: "select", options: ["600", "900", "1200", "1500", "1800", "2100", "0"], placeholder: "Time of day" },
  { key: "resolved", label: "Resolved", type: "select", options: ["false", "true"] },
  { key: "trigger_condition", label: "Trigger Condition", type: "text", placeholder: "When/if this should surface..." },
];

const ROLE_OPTIONS = ["subject", "target", "location", "witness", "advances", "complicates", "resolves"];

const TIME_LABELS: Record<string, string> = {
  "0": "Midnight",
  "600": "Dawn",
  "900": "Morning",
  "1200": "Midday",
  "1500": "Afternoon",
  "1800": "Evening",
  "2100": "Night",
};

export function EventCard({
  item,
  index,
  onChange,
  onToggle,
  entityOptions = [],
}: {
  item: BaseItem;
  index: number;
  onChange: (index: number, key: string, value: unknown) => void;
  onToggle: (index: number) => void;
  entityOptions?: EntityOption[];
}) {
  const [editing, setEditing] = useState(false);
  const tags = (item.entity_tags ?? []) as {
    name: string;
    entity_id?: string;
    entity_type?: string;
    role: string;
  }[];

  function addEntityTag(entity: EntityOption) {
    const existing = tags.find((t) => t.entity_id === entity.id);
    if (existing) return;
    const newTags = [
      ...tags,
      {
        name: entity.name,
        entity_id: entity.id,
        entity_type: entity.entity_type,
        role: "subject",
      },
    ];
    onChange(index, "entity_tags", newTags);
  }

  function removeEntityTag(entityId: string) {
    onChange(
      index,
      "entity_tags",
      tags.filter((t) => t.entity_id !== entityId)
    );
  }

  function updateTagRole(entityId: string, role: string) {
    onChange(
      index,
      "entity_tags",
      tags.map((t) => (t.entity_id === entityId ? { ...t, role } : t))
    );
  }

  return (
    <Card
      className={`grain transition-opacity ${item._accepted ? "" : "opacity-40"}`}
    >
      <CardContent className="py-3">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={item._accepted}
            onCheckedChange={() => onToggle(index)}
            className="mt-1 shrink-0"
          />
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-3">
                {EVENT_FIELDS.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      {field.label}
                    </Label>
                    {field.type === "textarea" && (
                      <Textarea
                        value={String(item[field.key] ?? "")}
                        onChange={(e) =>
                          onChange(index, field.key, e.target.value)
                        }
                        placeholder={field.placeholder}
                        rows={2}
                      />
                    )}
                    {field.type === "text" && (
                      <Input
                        value={String(item[field.key] ?? "")}
                        onChange={(e) =>
                          onChange(index, field.key, e.target.value)
                        }
                        placeholder={field.placeholder}
                      />
                    )}
                    {field.type === "number" && (
                      <Input
                        type="number"
                        value={String(item[field.key] ?? "")}
                        onChange={(e) =>
                          onChange(
                            index,
                            field.key,
                            e.target.value
                              ? parseInt(e.target.value)
                              : null
                          )
                        }
                        placeholder={field.placeholder}
                      />
                    )}
                    {field.type === "select" && field.options && (
                      <Select
                        value={String(item[field.key] ?? "")}
                        onValueChange={(v) =>
                          onChange(index, field.key, v ?? "")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={field.placeholder}>
                            {String(item[field.key] ?? "") || undefined}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {field.options.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ))}

                {/* Entity Tags */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Tagged Entities
                  </Label>
                  {tags.length > 0 && (
                    <div className="space-y-1.5">
                      {tags.map((tag) => (
                        <div
                          key={tag.entity_id ?? tag.name}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="flex-1 truncate">{tag.name}</span>
                          <Select
                            value={tag.role}
                            onValueChange={(v) =>
                              updateTagRole(tag.entity_id!, v ?? "subject")
                            }
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue>
                                {tag.role}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {ROLE_OPTIONS.map((r) => (
                                <SelectItem key={r} value={r}>
                                  {r}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() =>
                              removeEntityTag(tag.entity_id!)
                            }
                          >
                            <X className="size-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {entityOptions.length > 0 && (
                    <Select
                      value=""
                      onValueChange={(v) => {
                        if (!v) return;
                        const entity = entityOptions.find(
                          (e) => e.id === v
                        );
                        if (entity) addEntityTag(entity);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Add entity..." />
                      </SelectTrigger>
                      <SelectContent>
                        {entityOptions
                          .filter(
                            (e) => !tags.some((t) => t.entity_id === e.id)
                          )
                          .map((entity) => (
                            <SelectItem key={entity.id} value={entity.id}>
                              <span className="flex items-center gap-1.5">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1"
                                >
                                  {entity.entity_type}
                                </Badge>
                                {entity.name}
                              </span>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(false)}
                >
                  <X className="size-3.5 mr-1" />
                  Done
                </Button>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    {item.event_type != null && (
                      <Badge variant="outline" className="text-xs">
                        {String(item.event_type)}
                      </Badge>
                    )}
                    {item.weight != null && (
                      <Badge variant="secondary" className="text-xs">
                        w{String(item.weight)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm line-clamp-2">
                    {String(item.content ?? item.summary ?? "")}
                  </p>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {tags.map((tag) => (
                        <Badge
                          key={tag.entity_id ?? tag.name}
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {tag.name}
                          <span className="text-muted-foreground ml-1">
                            ({tag.role})
                          </span>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                {item._accepted && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setEditing(true)}
                    className="shrink-0"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        {!editing && item.source_excerpt && (
          <p className="text-xs text-muted-foreground italic border-l-2 border-rune pl-2 ml-8 mt-2">
            &ldquo;{String(item.source_excerpt)}&rdquo;
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Conversation Card ──────────────────────────────────────

const CONVERSATION_FIELDS: FieldDef[] = [
  { key: "title", label: "Title", type: "text", placeholder: "Conversation title" },
  { key: "summary", label: "Summary", type: "text", placeholder: "What happened in this conversation" },
  { key: "gm_notes", label: "GM Notes", type: "textarea", placeholder: "Hidden context, subtext, what wasn't said..." },
];

export function ConversationCard({
  item,
  index,
  onChange,
  onToggle,
}: {
  item: BaseItem;
  index: number;
  onChange: (index: number, key: string, value: unknown) => void;
  onToggle: (index: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const turns = (item.turns ?? []) as {
    speaker: string;
    text: string;
    tone: string;
  }[];

  return (
    <Card
      className={`grain transition-opacity ${item._accepted ? "" : "opacity-40"}`}
    >
      <CardContent className="py-3">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={item._accepted}
            onCheckedChange={() => onToggle(index)}
            className="mt-1 shrink-0"
          />
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-3">
                {CONVERSATION_FIELDS.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      {field.label}
                    </Label>
                    <Input
                      value={String(item[field.key] ?? "")}
                      onChange={(e) =>
                        onChange(index, field.key, e.target.value)
                      }
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
                {turns.length > 0 && (
                  <div className="space-y-1 border-l-2 border-gold/30 pl-3">
                    {turns.map((turn, j) => (
                      <p key={j} className="text-sm">
                        <span className="font-medium">{turn.speaker}:</span>{" "}
                        <span className="text-muted-foreground">
                          {turn.text}
                        </span>
                      </p>
                    ))}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(false)}
                >
                  <X className="size-3.5 mr-1" />
                  Done
                </Button>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium">
                    {String(item.title ?? "Untitled conversation")}
                  </p>
                  {item.summary != null && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {String(item.summary)}
                    </p>
                  )}
                  {turns.length > 0 && (
                    <div className="mt-1.5 space-y-0.5 text-xs text-muted-foreground border-l-2 border-gold/30 pl-2">
                      {turns.slice(0, 2).map((turn, j) => (
                        <p key={j}>
                          <span className="font-medium text-foreground">
                            {turn.speaker}:
                          </span>{" "}
                          {turn.text}
                        </p>
                      ))}
                      {turns.length > 2 && (
                        <p className="italic">
                          ...{turns.length - 2} more turns
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {item._accepted && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setEditing(true)}
                    className="shrink-0"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        {!editing && item.source_excerpt && (
          <p className="text-xs text-muted-foreground italic border-l-2 border-rune pl-2 ml-8 mt-2">
            &ldquo;{String(item.source_excerpt)}&rdquo;
          </p>
        )}
      </CardContent>
    </Card>
  );
}
