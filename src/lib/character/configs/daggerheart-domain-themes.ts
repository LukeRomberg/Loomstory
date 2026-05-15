import {
  BookOpen, Crosshair, HeartPulse, Mic, Moon, ShieldCheck,
  Sprout, Swords, Zap,
} from "lucide-react";
import type { ClassTheme } from "../wizard-types";

/**
 * One visual theme per Daggerheart SRD domain (9-09-25, page 7). Used to color
 * and ice domain-card picker tiles so the two cards from a class (e.g. Blade
 * + Bone for Warrior) are visually distinguishable at a glance.
 *
 * Reuses `ClassTheme` for shape parity — the picker treats both interchangeably.
 */
export const DAGGERHEART_DOMAIN_THEMES: Record<string, ClassTheme> = {
  Arcana: {
    gradient: "from-violet-950 via-purple-950 to-violet-950",
    borderColor: "border-violet-500",
    textColor: "text-violet-300",
    icon: Zap,
  },
  Blade: {
    gradient: "from-red-950 via-rose-900 to-red-950",
    borderColor: "border-red-700",
    textColor: "text-red-300",
    icon: Swords,
  },
  Bone: {
    gradient: "from-stone-900 via-zinc-900 to-stone-900",
    borderColor: "border-stone-500",
    textColor: "text-stone-300",
    icon: Crosshair,
  },
  Codex: {
    gradient: "from-indigo-950 via-slate-900 to-indigo-950",
    borderColor: "border-indigo-500",
    textColor: "text-indigo-300",
    icon: BookOpen,
  },
  Grace: {
    gradient: "from-pink-950 via-rose-950 to-pink-950",
    borderColor: "border-pink-500",
    textColor: "text-pink-300",
    icon: Mic,
  },
  Midnight: {
    gradient: "from-slate-950 via-zinc-950 to-slate-950",
    borderColor: "border-slate-500",
    textColor: "text-slate-300",
    icon: Moon,
  },
  Sage: {
    gradient: "from-green-950 via-emerald-950 to-green-950",
    borderColor: "border-green-600",
    textColor: "text-green-300",
    icon: Sprout,
  },
  Splendor: {
    gradient: "from-amber-950 via-yellow-950 to-amber-950",
    borderColor: "border-amber-400",
    textColor: "text-amber-300",
    icon: HeartPulse,
  },
  Valor: {
    gradient: "from-blue-950 via-sky-950 to-blue-950",
    borderColor: "border-blue-500",
    textColor: "text-blue-300",
    icon: ShieldCheck,
  },
};
