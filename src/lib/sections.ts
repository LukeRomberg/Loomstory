import {
  BookOpen,
  GitBranch,
  MapPin,
  MessageSquare,
  Scroll,
  ScrollText,
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
}

// Order matches the visual layout of bookshelf.png:
// Top shelf (left to right): NPCs, Factions, Events, Conversations, Plot Threads, Items, Lore, Characters.
// Bottom shelf interactive items: Locations (globe), Sessions (stacked green books).
export const CAMPAIGN_SECTIONS: readonly CampaignSection[] = [
  { slug: "npcs", title: "NPCs", emblem: Users, color: "mahogany" },
  { slug: "factions", title: "Factions", emblem: Shield, color: "ink-blue" },
  { slug: "events", title: "Events", emblem: Scroll, color: "forest" },
  { slug: "conversations", title: "Conversations", emblem: MessageSquare, color: "mahogany" },
  { slug: "plot-threads", title: "Plot Threads", emblem: GitBranch, color: "deep-brown" },
  { slug: "items", title: "Items", emblem: Sword, color: "ink-blue" },
  { slug: "lore", title: "Lore", emblem: BookOpen, color: "forest" },
  { slug: "characters", title: "Characters", emblem: UserCircle, color: "mahogany" },
  { slug: "locations", title: "Locations", emblem: MapPin, color: "deep-brown" },
  { slug: "sessions", title: "Sessions", emblem: ScrollText, color: "forest" },
] as const;
