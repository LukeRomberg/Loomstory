import {
  Sword, Leaf, Shield, TreePine, Eye, Sun,
  Sparkles, Music, BookOpen,
} from "lucide-react";
import type { WizardConfig, ClassTheme } from "../wizard-types";

// ─── Class Themes ───────────────────────────────────────────

export const DAGGERHEART_CLASS_THEMES: Record<string, ClassTheme> = {
  Bard: {
    gradient: "from-pink-950 via-purple-950 to-pink-950",
    borderColor: "border-pink-500",
    textColor: "text-pink-300",
    icon: Music,
    domains: ["Grace", "Codex"],
  },
  Druid: {
    gradient: "from-green-950 via-teal-950 to-green-950",
    borderColor: "border-green-600",
    textColor: "text-green-300",
    icon: Leaf,
    domains: ["Sage", "Arcana"],
  },
  Guardian: {
    gradient: "from-blue-950 via-slate-900 to-blue-950",
    borderColor: "border-blue-500",
    textColor: "text-blue-300",
    icon: Shield,
    domains: ["Valor", "Blade"],
  },
  Ranger: {
    gradient: "from-emerald-950 via-stone-900 to-emerald-950",
    borderColor: "border-emerald-600",
    textColor: "text-emerald-300",
    icon: TreePine,
    domains: ["Bone", "Sage"],
  },
  Rogue: {
    gradient: "from-zinc-950 via-stone-900 to-zinc-950",
    borderColor: "border-amber-700",
    textColor: "text-amber-400",
    icon: Eye,
    domains: ["Midnight", "Grace"],
  },
  Seraph: {
    gradient: "from-amber-950 via-slate-900 to-amber-950",
    borderColor: "border-amber-400",
    textColor: "text-amber-300",
    icon: Sun,
    domains: ["Splendor", "Valor"],
  },
  Sorcerer: {
    gradient: "from-violet-950 via-indigo-950 to-violet-950",
    borderColor: "border-violet-500",
    textColor: "text-violet-300",
    icon: Sparkles,
    domains: ["Arcana", "Midnight"],
  },
  Warrior: {
    gradient: "from-red-950 via-rose-900 to-red-950",
    borderColor: "border-red-700",
    textColor: "text-red-300",
    icon: Sword,
    domains: ["Blade", "Bone"],
  },
  Wizard: {
    gradient: "from-indigo-950 via-slate-900 to-indigo-950",
    borderColor: "border-indigo-500",
    textColor: "text-indigo-300",
    icon: BookOpen,
    domains: ["Codex", "Splendor"],
  },
};

// ─── Trait Config ────────────────────────────────────────────

export const DAGGERHEART_TRAIT_SLOTS = [
  { key: "agility", label: "Agility", group: "Agility / Strength" },
  { key: "strength", label: "Strength", group: "Agility / Strength" },
  { key: "finesse", label: "Finesse", group: "Finesse / Instinct" },
  { key: "instinct", label: "Instinct", group: "Finesse / Instinct" },
  { key: "presence", label: "Presence", group: "Presence / Knowledge" },
  { key: "knowledge", label: "Knowledge", group: "Presence / Knowledge" },
];

export const DAGGERHEART_STANDARD_ARRAY = [3, 2, 1, 1, 0, -1];
export const DAGGERHEART_MARK_COUNT = 2;

// ─── Wizard Config ──────────────────────────────────────────

export const DAGGERHEART_WIZARD_CONFIG: WizardConfig = {
  classThemes: DAGGERHEART_CLASS_THEMES,
  phases: [
    { label: "Name", steps: ["name"] },
    { label: "Class", steps: ["class_pick", "subclass_pick"] },
    { label: "Heritage", steps: ["ancestry"] },
    { label: "Traits", steps: ["traits"] },
    { label: "Create", steps: ["review"] },
  ],
  steps: {
    name: {
      enabled: true,
      label: "Name Your Hero",
      subtitle: "Every legend starts with a name.",
      component: "text_field_group",
      config: {
        fields: [
          { key: "name", label: "Character Name", placeholder: "Enter a name...", required: true },
        ],
      },
    },
    class_pick: {
      enabled: true,
      label: "Choose Your Class",
      subtitle: "Your class defines how you meet the world — and how the world meets you.",
      helpText: "Each class has two domains that determine the types of abilities available to you. Click a card to expand it and learn more before choosing.",
      component: "card_picker",
      dataSource: {
        table: "compendium_classes",
        filter: { is_subclass: false },
      },
    },
    subclass_pick: {
      enabled: true,
      label: "Choose Your Path",
      subtitle: "Your subclass shapes how you grow.",
      component: "card_picker",
      dataSource: {
        table: "compendium_classes",
        filter: { is_subclass: true },
        dependsOn: "class_pick",
        dependColumn: "parent_class_id",
      },
      config: { columns: 2 },
    },
    ancestry: {
      enabled: true,
      label: "Your Heritage",
      subtitle: "Where you come from shapes who you are.",
      helpText: "Ancestry and community are narrative choices in Daggerheart — pick whatever feels right for your character.",
      component: "text_field_group",
      config: {
        fields: [
          { key: "ancestry", label: "Ancestry", placeholder: "e.g. Firbolg, Katari, Fungril" },
          { key: "community", label: "Community", placeholder: "e.g. Highborne, Wanderborne" },
        ],
      },
    },
    traits: {
      enabled: true,
      label: "Assign Traits",
      subtitle: "Distribute your trait values and mark two.",
      helpText: "Assign the standard array (+3, +2, +1, +1, 0, -1) to your six traits. Then mark two traits — these are the ones your character can roll with advantage.",
      component: "stat_assigner",
      config: {
        slots: DAGGERHEART_TRAIT_SLOTS,
        standardArray: DAGGERHEART_STANDARD_ARRAY,
        markCount: DAGGERHEART_MARK_COUNT,
      },
    },
    review: {
      enabled: true,
      label: "Review & Create",
      subtitle: "One last look before the adventure begins.",
      component: "review_summary",
    },
  },
};
