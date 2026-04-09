/**
 * SEED-35: Properties JSONB conventions for compendium_items.
 * Each item type has a specific shape for the `properties` JSONB column.
 */

/** Weapon properties (5e, PF2e, DW, DH) */
export interface WeaponProperties {
  damage_die: string; // e.g. "1d8", "2d6"
  damage_type: string; // e.g. "Slashing", "Piercing", "Bludgeoning"
  properties: string[]; // e.g. ["Finesse", "Light", "Thrown"]
  range?: string; // e.g. "20/60", "80/320"
  weight?: string; // e.g. "2 lb."
  cost?: string; // e.g. "10 GP"
  category?: string; // e.g. "Simple Melee", "Martial Ranged"
  mastery?: string; // 5e mastery property: "Vex", "Slow", etc.
  // PF2e-specific
  bulk?: string; // e.g. "1", "L"
  hands?: string; // e.g. "1", "1+", "2"
  group?: string; // e.g. "Sword", "Bow"
  traits?: string[]; // PF2e traits: ["Agile", "Finesse"]
  price?: string; // PF2e price: "1 gp"
  // DH-specific
  primary_trait?: string; // e.g. "Finesse", "Strength"
  feature?: string; // weapon feature text
  tier?: number; // 1-4
  // DW-specific
  tags?: string[]; // ["close", "reach", "messy"]
}

/** Armor properties (5e, PF2e, DW, DH) */
export interface ArmorProperties {
  ac: string; // e.g. "14 + Dex modifier (max 2)", "+2"
  armor_type: string; // e.g. "Light", "Medium", "Heavy", "Shield"
  stealth_disadvantage?: boolean;
  strength_req?: string; // e.g. "Str 13"
  weight?: string;
  cost?: string;
  don_time?: string; // e.g. "1 minute", "10 minutes"
  // PF2e-specific
  bulk?: string;
  group?: string; // e.g. "Leather", "Chain"
  traits?: string[];
  price?: string;
  // DH-specific
  tier?: number;
  feature?: string;
  // DW-specific
  armor_value?: number; // e.g. 1, 2, 3
  tags?: string[]; // ["clumsy"]
}

/** Gear/tool/consumable properties */
export interface GearProperties {
  weight?: string;
  cost?: string;
  description?: string; // brief description if not in main description column
  // PF2e-specific
  bulk?: string;
  traits?: string[];
  price?: string;
}

/** Magic item properties (5e) */
export interface MagicItemProperties {
  rarity: string; // "Common" | "Uncommon" | "Rare" | "Very Rare" | "Legendary" | "Artifact"
  attunement?: boolean | string; // true, false, or "by a cleric", etc.
  charges?: number;
  category: string; // "Armor" | "Potion" | "Ring" | "Rod" | "Scroll" | "Staff" | "Wand" | "Weapon" | "Wondrous Item"
  base_item?: string; // e.g. "Plate Armor", "Longsword"
}

/**
 * Union type for the properties column.
 * Use the item's `type` column to determine which shape applies:
 *   weapon -> WeaponProperties
 *   armor -> ArmorProperties
 *   gear | tool -> GearProperties
 *   magic_item -> MagicItemProperties
 *   consumable -> GearProperties (with charges/effect in description)
 */
export type CompendiumItemProperties =
  | WeaponProperties
  | ArmorProperties
  | GearProperties
  | MagicItemProperties;