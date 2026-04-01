/**
 * Character data validation against system templates.
 *
 * Validates that character data conforms to the template's field definitions
 * (types, required, min/max). Used server-side before saves (CHAR-10).
 */

import type { Section, Field, StorageBinding } from "@/types/system-template";

export interface ValidationError {
  field_key: string;
  section_key: string;
  message: string;
}

export interface CharacterData {
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Validate character data against a system template.
 * Returns an array of validation errors (empty = valid).
 */
export function validateCharacterData(
  sections: Section[],
  characterData: CharacterData
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const section of sections) {
    for (const field of section.fields) {
      validateField(field, section.key, characterData, errors);
    }
  }

  return errors;
}

function validateField(
  field: Field,
  sectionKey: string,
  characterData: CharacterData,
  errors: ValidationError[]
): void {
  // Skip computed fields — they're derived, not user-input
  if (field.computed) return;

  // Skip table/list bindings — validated at the row level
  if (
    field.storage.target === "abilities" ||
    field.storage.target === "items" ||
    field.storage.target === "conditions" ||
    field.storage.target === "classes"
  ) {
    return;
  }

  const value = resolveValue(field.storage, characterData);

  // Required check
  if (field.required && (value === undefined || value === null || value === "")) {
    errors.push({
      field_key: field.key,
      section_key: sectionKey,
      message: `${field.label} is required`,
    });
    return;
  }

  // Skip further validation if no value and not required
  if (value === undefined || value === null) return;

  // Type-specific validation
  if (field.type === "number" || field.type === "stat_block") {
    const num = typeof value === "number" ? value : Number(value);
    if (isNaN(num)) {
      errors.push({
        field_key: field.key,
        section_key: sectionKey,
        message: `${field.label} must be a number`,
      });
      return;
    }
    if (field.min !== undefined && num < field.min) {
      errors.push({
        field_key: field.key,
        section_key: sectionKey,
        message: `${field.label} must be at least ${field.min}`,
      });
    }
    if (field.max !== undefined && num > field.max) {
      errors.push({
        field_key: field.key,
        section_key: sectionKey,
        message: `${field.label} must be at most ${field.max}`,
      });
    }
  }

  if (field.type === "select" && field.options) {
    const validValues = field.options.map((o) => o.value);
    if (!validValues.includes(value as string | number)) {
      errors.push({
        field_key: field.key,
        section_key: sectionKey,
        message: `${field.label} must be one of: ${validValues.join(", ")}`,
      });
    }
  }

  if (field.type === "boolean") {
    if (typeof value !== "boolean") {
      errors.push({
        field_key: field.key,
        section_key: sectionKey,
        message: `${field.label} must be true or false`,
      });
    }
  }

  // Validate children recursively
  if (field.children) {
    for (const child of field.children) {
      validateField(child, sectionKey, characterData, errors);
    }
  }
}

/**
 * Resolve a field's current value from character data based on its storage binding.
 * Only handles core and data bindings — stat/resource/note values come from their own tables.
 */
function resolveValue(
  storage: StorageBinding,
  characterData: CharacterData
): unknown {
  if (storage.target === "core") {
    return characterData[storage.column];
  }

  if (storage.target === "data") {
    return getNestedValue(characterData.data ?? {}, storage.path);
  }

  // Stat, resource, note, etc. — these are validated at the row level
  // by their respective table constraints, not by this function
  return undefined;
}

function getNestedValue(
  obj: Record<string, unknown>,
  path: string
): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}
