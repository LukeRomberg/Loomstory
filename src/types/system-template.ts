/**
 * System Template Schema Types
 *
 * Defines the structure of `system_templates.sections` JSONB.
 * Each system (5e, PF2e, Daggerheart, DW) has a template that tells the UI
 * what fields to show and where each field reads/writes in the DB.
 */

// --- Field Types ---

export type FieldType =
  | "number"
  | "text"
  | "textarea"
  | "richtext"
  | "boolean"
  | "select"
  | "rank"
  | "slot_tracker"
  | "resource_bar"
  | "stat_block"
  | "list"
  | "currency"
  | "armor_slots"
  | "damage_threshold"
  | "tag_list"
  | "table"
  | "hidden";

// --- Storage Bindings ---

export type StorageBinding =
  | CoreFieldBinding
  | DataJsonBinding
  | StatBinding
  | StatGroupBinding
  | ResourceBinding
  | ResourceGroupBinding
  | AbilityTableBinding
  | ItemTableBinding
  | NoteBinding
  | ConditionTableBinding
  | ClassBinding;

export interface CoreFieldBinding {
  target: "core";
  column:
    | "name"
    | "level"
    | "experience"
    | "hp_current"
    | "hp_max"
    | "portrait_url"
    | "gm_notes";
}

export interface DataJsonBinding {
  target: "data";
  path: string;
}

export interface StatBinding {
  target: "stat";
  stat_key: string;
  data_fields?: string[];
}

export interface StatGroupBinding {
  target: "stat_group";
  prefix: string;
  fixed_keys?: string[];
  allow_custom?: boolean;
  template?: Field;
}

export interface ResourceBinding {
  target: "resource";
  resource_key: string;
}

export interface ResourceGroupBinding {
  target: "resource_group";
  prefix: string;
  fixed_keys?: string[];
  template?: Field;
}

export interface AbilityColumnDef {
  source_field: string;
  label: string;
  type: FieldType;
  width?: string;
}

export interface AbilityTableBinding {
  target: "abilities";
  ability_type: string;
  columns?: AbilityColumnDef[];
}

export interface ItemColumnDef {
  source_field: string;
  label: string;
  type: FieldType;
  width?: string;
}

export interface ItemTableBinding {
  target: "items";
  item_type?: string;
  weight_label?: string;
  columns?: ItemColumnDef[];
}

export interface NoteBinding {
  target: "note";
  note_key: string;
}

export interface ConditionTableBinding {
  target: "conditions";
  show_severity?: boolean;
}

export interface ClassBinding {
  target: "classes";
}

// --- Computed Fields ---

export interface ComputedDef {
  formula: string;
  depends_on: string[];
  display_prefix?: string;
}

// --- Conditional Visibility ---

export interface VisibleCondition {
  field: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "truthy" | "falsy";
  value?: unknown;
}

// --- Options ---

export interface FieldOption {
  value: string | number;
  label: string;
  description?: string;
}

// --- Field ---

export interface Field {
  key: string;
  label: string;
  type: FieldType;
  order: number;
  storage: StorageBinding;
  width?: "full" | "half" | "third" | "quarter";
  placeholder?: string;
  help_text?: string;
  group?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: FieldOption[];
  default_value?: unknown;
  computed?: ComputedDef;
  visible_when?: VisibleCondition;
  children?: Field[];
}

// --- Section ---

export interface Section {
  key: string;
  label: string;
  icon?: string;
  order: number;
  layout: "grid" | "list" | "table" | "columns" | "freeform";
  columns?: number;
  collapsed_default?: boolean;
  fields: Field[];
}

// --- System Template ---

export type SystemTemplateSections = Section[];
