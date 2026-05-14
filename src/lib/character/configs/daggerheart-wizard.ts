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

// ─── Class-Specific Starting Items (SRD step 5) ────────────
// Each class's character guide lists two choices the player picks between. The
// items are flavor inventory entries with no mechanical effect, so they're
// hardcoded here rather than seeded into compendium_items.

export const DAGGERHEART_CLASS_ITEMS: Record<string, [string, string]> = {
  Bard: ["A romance novel", "A letter never opened"],
  Druid: ["A small bag of rocks and bones", "A strange pendant found in the dirt"],
  Guardian: ["A totem from your mentor", "A secret key"],
  Ranger: ["A trophy from your first kill", "A seemingly broken compass"],
  Rogue: ["A set of forgery tools", "A grappling hook"],
  Seraph: ["A bundle of offerings", "A sigil of your god"],
  Sorcerer: ["A whispering orb", "A family heirloom"],
  Warrior: ["The drawing of a lover", "A sharpening stone"],
  Wizard: ["A book you're trying to translate", "A tiny, harmless elemental pet"],
};

// ─── Basic Starting Supplies (SRD step 5) ──────────────────
// These four items are auto-added to every Daggerheart character on save. They
// are seeded into compendium_items by migration 20260514000003 so character_items
// rows can link back via compendium_item_ref_id.
export const DAGGERHEART_BASIC_SUPPLY_NAMES = [
  "Torch",
  "50 ft of Rope",
  "Basic Supplies",
  "Handful of Gold",
] as const;

// ─── Experience Suggestions ──────────────────────────────────

// Daggerheart SRD 9-09-25 step 7 (page 5) "EXAMPLE EXPERIENCES". These are flavor
// inspiration only — players can write any phrase. The wizard renders these as
// clickable chips so the player can drop a category example into an input.
export const DAGGERHEART_EXPERIENCE_SUGGESTIONS: ReadonlyArray<{
  label: string;
  items: readonly string[];
}> = [
  {
    label: "Backgrounds",
    items: [
      "Assassin",
      "Blacksmith",
      "Bodyguard",
      "Bounty Hunter",
      "Chef to the Royal Family",
      "Circus Performer",
      "Con Artist",
      "Fallen Monarch",
      "Field Medic",
      "High Priestess",
      "Merchant",
      "Noble",
      "Pirate",
      "Politician",
      "Runaway",
      "Scholar",
      "Sellsword",
      "Soldier",
      "Storyteller",
      "Thief",
      "World Traveler",
    ],
  },
  {
    label: "Characteristics",
    items: [
      "Affable",
      "Battle-Hardened",
      "Bookworm",
      "Charming",
      "Cowardly",
      "Friend to All",
      "Helpful",
      "Intimidating Presence",
      "Leader",
      "Lone Wolf",
      "Loyal",
      "Observant",
      "Prankster",
      "Silver Tongue",
      "Sticky Fingers",
      "Stubborn to a Fault",
      "Survivor",
      "Young and Naive",
    ],
  },
  {
    label: "Specialties",
    items: [
      "Acrobat",
      "Gambler",
      "Healer",
      "Inventor",
      "Magical Historian",
      "Mapmaker",
      "Master of Disguise",
      "Navigator",
      "Sharpshooter",
      "Survivalist",
      "Swashbuckler",
      "Tactician",
    ],
  },
  {
    label: "Skills",
    items: [
      "Animal Whisperer",
      "Barter",
      "Deadly Aim",
      "Fast Learner",
      "Incredible Strength",
      "Liar",
      "Light Feet",
      "Negotiator",
      "Photographic Memory",
      "Quick Hands",
      "Repair",
      "Scavenger",
      "Tracker",
    ],
  },
  {
    label: "Phrases",
    items: [
      "Catch Me If You Can",
      "Fake It Till You Make It",
      "First Time's the Charm",
      "Hold the Line",
      "I Won't Let You Down",
      "I'll Catch You",
      "I've Got Your Back",
      "Knowledge Is Power",
      "Nature's Friend",
      "Never Again",
      "No One Left Behind",
      "Pick on Someone Your Own Size",
      "The Show Must Go On",
      "This Is Not a Negotiation",
      "Wolf in Sheep's Clothing",
    ],
  },
];

// ─── Wizard Config ──────────────────────────────────────────

export const DAGGERHEART_WIZARD_CONFIG: WizardConfig = {
  classThemes: DAGGERHEART_CLASS_THEMES,
  phases: [
    { label: "Class", steps: ["class_pick", "subclass_pick"] },
    { label: "Heritage", steps: ["ancestry_pick", "community_pick"] },
    {
      label: "Equipment",
      steps: [
        "weapon_primary_pick",
        "weapon_secondary_pick",
        "armor_pick",
        "potion_pick",
        "class_item_pick",
      ],
    },
    { label: "Traits", steps: ["traits"] },
    { label: "Experiences", steps: ["experiences_pick"] },
    { label: "Cards", steps: ["domain_cards_pick"] },
    { label: "Create", steps: ["review"] },
  ],
  steps: {
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
    weapon_primary_pick: {
      enabled: true,
      label: "Choose Your Primary Weapon",
      shortLabel: "Weapon",
      subtitle: "Either a two-handed weapon, or a one-handed weapon paired with a secondary.",
      helpText: "Pick a Tier 1 primary weapon. If you pick a one-handed primary, you'll choose a secondary weapon next. Two-handed weapons are used alone. Cards show damage dice, range, and the trait you roll with.",
      component: "card_picker",
      dataSource: {
        table: "compendium_items",
        filter: { type: "weapon" },
      },
    },
    weapon_secondary_pick: {
      enabled: true,
      label: "Choose Your Secondary Weapon",
      shortLabel: "Secondary",
      subtitle: "Pair it with your primary one-handed weapon.",
      helpText: "Secondary weapons add a feature on top of your primary — shields raise your Armor Score, paired blades boost damage, grapplers pull foes in, and so on.",
      component: "card_picker",
      dataSource: {
        table: "compendium_items",
        filter: { type: "weapon" },
      },
      // Only shown when the chosen primary weapon is One-Handed. The wizard
      // mirrors that bit to `wizardState.primaryWeaponIsTwoHanded` on selection.
      showWhen: {
        requiresState: { key: "primaryWeaponIsTwoHanded", equals: false },
      },
    },
    armor_pick: {
      enabled: true,
      label: "Choose Your Armor",
      shortLabel: "Armor",
      subtitle: "Set your damage thresholds and Armor Score.",
      helpText: "Tier 1 armor sets your base Armor Score and the Major/Severe damage thresholds. Heavier armor offers more protection at a cost to Evasion or Agility.",
      component: "card_picker",
      dataSource: {
        table: "compendium_items",
        filter: { type: "armor" },
      },
    },
    potion_pick: {
      enabled: true,
      label: "Choose a Starting Potion",
      shortLabel: "Potion",
      subtitle: "Bring a Minor Health Potion or a Minor Stamina Potion.",
      helpText: "Each character starts with one minor potion. Minor Health clears 1d4 HP. Minor Stamina clears 1d4 Stress. Pick whichever you expect you'll lean on first.",
      component: "card_picker",
      dataSource: {
        table: "compendium_items",
        filter: { type: "consumable" },
      },
    },
    class_item_pick: {
      enabled: true,
      label: "Choose Your Class Item",
      shortLabel: "Class Item",
      subtitle: "A meaningful object from your past.",
      helpText: "Your class's character guide lists two flavor items. Pick the one that resonates more with your hero's story — it's narrative inventory only, no mechanical effect.",
      // No dataSource — options come from DAGGERHEART_CLASS_ITEMS keyed on the chosen class.
      component: "card_picker",
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
    experiences_pick: {
      enabled: true,
      label: "Create Your Experiences",
      shortLabel: "Experiences",
      subtitle: "Two short phrases that capture who your hero has been.",
      helpText: "An Experience is a word or short phrase that captures a set of skills, traits, or aptitudes your hero has gathered across their life. You'll write two — each grants a +2 modifier you can spend a Hope to add to a relevant roll. Stay specific (not 'Lucky' or 'Highly Skilled') and avoid built-in special abilities. Tap a chip below to drop an SRD example into whichever input you most recently clicked.",
      component: "experience_input",
      config: {
        count: 2,
        modifier: 2,
        suggestions: DAGGERHEART_EXPERIENCE_SUGGESTIONS,
      },
    },
    domain_cards_pick: {
      enabled: true,
      label: "Choose Your Domain Cards",
      shortLabel: "Cards",
      subtitle: "Pick two starting cards from your class's domains.",
      helpText: "At level 1, every Daggerheart hero picks two domain cards from the two domains their class has access to. Each card lists its domain, recall cost, and rules text. Tap a card to expand it, then Add or Remove to build your two-card loadout. You can swap selections any time before Continue.",
      component: "card_picker",
      dataSource: {
        table: "compendium_abilities",
        filter: { ability_type: "domain_card", level: 1 },
        dependsOn: "class_pick",
        dependColumn: "classes",
        dependType: "contains",
        dependValueFrom: "name",
      },
      config: { selectCount: 2 },
    },
    review: {
      enabled: true,
      label: "Behold Your Hero",
      shortLabel: "Behold",
      subtitle: "Name your character — then let the adventure begin.",
      helpText: "This is your hero, brought to life from every choice you've made. Name them, look over their sheet, and use Back to revise anything before you commit. Once you click Start Your Adventure, your hero is born.",
      component: "review_summary",
    },
  },
};
