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
 * Public-URL paths to ancestry headshot artwork. Each entry corresponds to a
 * file under `app/public/ancestries/`. The preview component prefers a
 * headshot when present and falls back to DAGGERHEART_ANCESTRY_ICONS when not,
 * so this map can grow in batches without breaking anything.
 *
 * As of 2026-05-15 only a subset of the 18 SRD ancestries have art;
 * the missing ones are intentionally omitted from this map.
 */
export const DAGGERHEART_ANCESTRY_IMAGES: Record<string, string> = {
  Clank: "/ancestries/Clank.png",
  Drakona: "/ancestries/Drakona.png",
  Dwarf: "/ancestries/Dwarf.png",
  Fungril: "/ancestries/Fungril.png",
  Galapa: "/ancestries/Galapa.png",
  Giant: "/ancestries/Giant.png",
  Goblin: "/ancestries/Goblin.png",
  Halfling: "/ancestries/Halfling.png",
  Ribbet: "/ancestries/Ribbet.png",
  Simiah: "/ancestries/Simiah.png",
};
