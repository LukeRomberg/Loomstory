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

// Daggerheart SRD 9-09-25 step 3 (page 4): "Assign the modifiers +2, +1, +1, +0, +0, -1
// to your character's traits in any order you wish." No marking-for-advantage mechanic.
export const DAGGERHEART_STANDARD_ARRAY = [2, 1, 1, 0, 0, -1];

// ─── Wizard Config ──────────────────────────────────────────

export const DAGGERHEART_WIZARD_CONFIG: WizardConfig = {
  classThemes: DAGGERHEART_CLASS_THEMES,
  phases: [
    { label: "Name", steps: ["name"] },
    { label: "Class", steps: ["class_pick", "subclass_pick"] },
    { label: "Heritage", steps: ["ancestry_pick", "community_pick"] },
    { label: "Traits", steps: ["traits"] },
    { label: "Create", steps: ["review"] },
  ],
  steps: {
    name: {
      enabled: true,
      label: "Name Your Hero",
      shortLabel: "Name",
      subtitle: "Every legend starts with a name.",
      helpText: "Welcome to character creation. We'll walk you through every choice that shapes your hero — class, subclass, heritage, traits, and more. Don't worry about getting anything perfect right now: you can revisit and change any of these decisions, including the name, right up until you click Create on the final step.",
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
      shortLabel: "Class",
      subtitle: "Your class defines how you meet the world — and how the world meets you.",
      helpText: "Every class has two domains that grant access to a unique pool of abilities. Each card lists the class's domains, starting Evasion and HP slots, spellcast trait, Hope feature, and class feature. Tap a card to expand it and read the details before committing.",
      component: "card_picker",
      dataSource: {
        table: "compendium_classes",
        filter: { is_subclass: false },
      },
    },
    subclass_pick: {
      enabled: true,
      label: "Choose Your Path",
      shortLabel: "Subclass",
      subtitle: "Your subclass shapes how your class grows.",
      helpText: "Each subclass unlocks three feature tiers: Foundation (level 1), Specialization (level 5), and Mastery (level 8). Subclass cards inherit your class's stats. Tap a card to read every feature you'd gain at each tier.",
      component: "card_picker",
      dataSource: {
        table: "compendium_classes",
        filter: { is_subclass: true },
        dependsOn: "class_pick",
        dependColumn: "parent_class_id",
      },
      config: { columns: 2 },
    },
    ancestry_pick: {
      enabled: true,
      label: "Choose Your Ancestry",
      shortLabel: "Ancestry",
      subtitle: "Your lineage shapes how you move through the world.",
      helpText: "Each Daggerheart ancestry grants two ancestry features — both are gained when you pick the ancestry. Tap a card to read its flavor and see both features in full.",
      component: "card_picker",
      dataSource: {
        table: "compendium_abilities",
        filter: { ability_type: "ancestry_feature" },
      },
    },
    community_pick: {
      enabled: true,
      label: "Choose Your Community",
      shortLabel: "Community",
      subtitle: "The culture or environment that raised you.",
      helpText: "Each community grants a single community feature reflecting your upbringing. Community cards also list six personality traits common to that group — useful inspiration for roleplay.",
      component: "card_picker",
      dataSource: {
        table: "compendium_abilities",
        filter: { ability_type: "community_feature" },
      },
    },
    traits: {
      enabled: true,
      label: "Assign Traits",
      shortLabel: "Traits",
      subtitle: "Distribute the standard array across your six traits.",
      helpText: "Daggerheart characters have six traits — Agility, Strength, Finesse, Instinct, Presence, Knowledge. Assign one of each modifier from the standard array (+2, +1, +1, +0, +0, -1) to a different trait. When you 'roll with a trait', that trait's modifier is added to your roll's total.",
      component: "stat_assigner",
      config: {
        slots: DAGGERHEART_TRAIT_SLOTS,
        standardArray: DAGGERHEART_STANDARD_ARRAY,
      },
    },
    review: {
      enabled: true,
      label: "Review & Create",
      shortLabel: "Review",
      subtitle: "One last look before the adventure begins.",
      helpText: "Take a final pass on every choice you made. Use the Back button to step back through the wizard and revise anything before you commit. Once you click Create, your hero is born and the adventure begins.",
      component: "review_summary",
    },
  },
};
