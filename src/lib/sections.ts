import {
  BookOpen,
  GitBranch,
  MapPin,
  MessageSquare,
  Scroll,
  Shield,
  Sword,
  UserCircle,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { BookColor } from "@/components/shared/book-spine";

export interface CampaignSection {
  slug: string;
  title: string;
  emblem: LucideIcon;
  color: BookColor;
  countKey: keyof EntityCounts;
}

export interface EntityCounts {
  npcs: number;
  locations: number;
  factions: number;
  events: number;
  conversations: number;
  plotThreads: number;
  items: number;
  lore: number;
  characters: number;
}

export const CAMPAIGN_SECTIONS: readonly CampaignSection[] = [
  { slug: "npcs", title: "NPCs", emblem: Users, color: "mahogany", countKey: "npcs" },
  { slug: "locations", title: "Locations", emblem: MapPin, color: "deep-brown", countKey: "locations" },
  { slug: "factions", title: "Factions", emblem: Shield, color: "ink-blue", countKey: "factions" },
  { slug: "events", title: "Events", emblem: Scroll, color: "forest", countKey: "events" },
  { slug: "conversations", title: "Conversations", emblem: MessageSquare, color: "mahogany", countKey: "conversations" },
  { slug: "plot-threads", title: "Plot Threads", emblem: GitBranch, color: "deep-brown", countKey: "plotThreads" },
  { slug: "items", title: "Items", emblem: Sword, color: "ink-blue", countKey: "items" },
  { slug: "lore", title: "Lore", emblem: BookOpen, color: "forest", countKey: "lore" },
  { slug: "characters", title: "Characters", emblem: UserCircle, color: "mahogany", countKey: "characters" },
] as const;
