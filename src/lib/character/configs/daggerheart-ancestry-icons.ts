import {
  Bone,
  Cat,
  Cog,
  Droplet,
  Ear,
  Feather,
  Flame,
  Footprints,
  Hammer,
  Hand,
  Moon,
  Mountain,
  Skull,
  Sprout,
  Shield,
  Trees,
  User,
  Wind,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Placeholder Lucide icons for the 18 Daggerheart SRD ancestries.
 *
 * These are stand-ins until proper ancestry art is sourced. Each pick reflects
 * a visual cue from the SRD's flavor description (e.g. Faerie → Feather for
 * wings, Galapa → Shield for the retractable shell). Real artwork can replace
 * these later via a `data.image_url` on the compendium row without changing
 * this file's shape.
 *
 * Conflicts with class icons (DAGGERHEART_CLASS_THEMES) were avoided where
 * reasonable so that a class icon + ancestry icon on the same banner don't
 * look identical.
 */
export const DAGGERHEART_ANCESTRY_ICONS: Record<string, LucideIcon> = {
  Clank: Cog,
  Drakona: Flame,
  Dwarf: Hammer,
  Elf: Moon,
  Faerie: Feather,
  Faun: Wind,
  Firbolg: Trees,
  Fungril: Sprout,
  Galapa: Shield,
  Giant: Mountain,
  Goblin: Ear,
  Halfling: Footprints,
  Human: User,
  Infernis: Skull,
  Katari: Cat,
  Orc: Bone,
  Ribbet: Droplet,
  Simiah: Hand,
};

/**
 * Variants of artwork available per ancestry. Each entry corresponds to a
 * file under `app/public/ancestries/`. Most ancestries have both a `female`
 * and `male` portrait; Clank is intentionally ungendered (`neutral`); a few
 * have only one variant available (the missing one falls back via
 * `getAncestryImage`). Ancestries entirely without art are omitted — they
 * fall through to DAGGERHEART_ANCESTRY_ICONS in the preview.
 */
export interface AncestryArt {
  female?: string;
  male?: string;
  /** Used when the art isn't gendered (e.g. Clank). Takes priority over the others. */
  neutral?: string;
}

export const DAGGERHEART_ANCESTRY_IMAGES: Record<string, AncestryArt> = {
  Clank: { neutral: "/ancestries/Clank.png" },
  Drakona: { female: "/ancestries/Drakona-f.png", male: "/ancestries/Drakona-m.png" },
  Dwarf: { female: "/ancestries/Dwarf-f.png", male: "/ancestries/Dwarf-m.png" },
  Elf: { female: "/ancestries/Elf-f.png", male: "/ancestries/Elf-m.png" },
  Faerie: { female: "/ancestries/Faerie-f.png", male: "/ancestries/Faerie-m.png" },
  Faun: { female: "/ancestries/Faun-f.png", male: "/ancestries/Faun-m.png" },
  Firbolg: { male: "/ancestries/Firbolg-m.png" },
  Fungril: { female: "/ancestries/Fungril-f.png" },
  Galapa: { female: "/ancestries/Galapa-f.png", male: "/ancestries/Galapa-m.png" },
  Giant: { female: "/ancestries/Giant-f.png", male: "/ancestries/Giant-m.png" },
  Goblin: { female: "/ancestries/Goblin-f.png", male: "/ancestries/Goblin-m.png" },
  Halfling: { female: "/ancestries/Halfling-f.png", male: "/ancestries/Halfling-m.png" },
  Human: { female: "/ancestries/Human-f.png", male: "/ancestries/Human-m.png" },
  Infernis: { female: "/ancestries/Infernis-f.png", male: "/ancestries/Infernis-m.png" },
  Katari: { female: "/ancestries/Katari-f.png", male: "/ancestries/Katari-m.png" },
  Orc: { female: "/ancestries/Orc-f.png", male: "/ancestries/Orc-m.png" },
  Ribbet: { male: "/ancestries/Ribbet-m.png" },
  Simiah: { female: "/ancestries/Simiah-f.png", male: "/ancestries/Simiah-m.png" },
};

export type AncestryVariant = "female" | "male";

/**
 * Best image URL for an ancestry given the player's preferred variant.
 * Resolution order: `neutral` art (Clank), then preferred variant, then any
 * other variant present. Returns null when the ancestry has no art at all.
 */
export function getAncestryImage(
  ancestry: string,
  variant: AncestryVariant
): string | null {
  const art = DAGGERHEART_ANCESTRY_IMAGES[ancestry];
  if (!art) return null;
  if (art.neutral) return art.neutral;
  return art[variant] ?? art.female ?? art.male ?? null;
}
