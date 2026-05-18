"use client";

import { useTransitionRouter } from "@/hooks/use-transition-router";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookCard,
  BookCardContent,
} from "@/components/shared/book-card";
import { SectionHeader } from "@/components/loomstory/section-header";
import { EmptyState } from "@/components/loomstory/empty-state";
import { Scroll, MessageSquare, BookOpen, Clock } from "lucide-react";

interface HistoryEvent {
  id: string;
  content: string;
  summary: string | null;
  weight: number;
  event_type: string;
  narrative_day: number | null;
  narrative_time: number | null;
  resolved: boolean;
  created_at: string;
  role: string;
}

interface HistoryConversation {
  id: string;
  title: string | null;
  participants: { name: string; entity_type: string }[];
  turn_count: number;
  created_at: string;
}

interface SessionMention {
  session_id: string;
  session_title: string;
  session_number: number | null;
  mention_type: string;
  created_at: string;
}

interface EntityHistoryData {
  events: HistoryEvent[];
  conversations: HistoryConversation[];
  session_mentions: SessionMention[];
}

interface EntityHistoryProps {
  campaignId: string;
  history: EntityHistoryData;
  tone?: "default" | "leather";
}

export function EntityHistory({
  campaignId,
  history,
  tone = "default",
}: EntityHistoryProps) {
  const router = useTransitionRouter();
  const isLeather = tone === "leather";
  const CardCmp = isLeather ? BookCard : Card;
  const CardContentCmp = isLeather ? BookCardContent : CardContent;
  const mutedText = isLeather ? "text-leather/65" : "text-muted-foreground";
  const isEmpty =
    history.events.length === 0 &&
    history.conversations.length === 0 &&
    history.session_mentions.length === 0;

  if (isEmpty) {
    return (
      <EmptyState
        icon={Clock}
        tone={isLeather ? "leather" : "default"}
        message="No history yet. This entity hasn't appeared in any sessions, events, or conversations."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Mentions */}
      {history.session_mentions.length > 0 && (
        <div>
          <SectionHeader className={`flex items-center gap-2 ${isLeather ? "!text-leather/70" : ""}`}>
            <BookOpen className="size-4 text-gold" />
            Sessions
          </SectionHeader>
          <div className="space-y-2">
            {history.session_mentions.map((mention) => (
              <CardCmp
                key={mention.session_id}
                className={isLeather ? "gold-glow cursor-pointer" : "grain gold-glow cursor-pointer"}
                onClick={() =>
                  router.push(
                    `/campaign/${campaignId}/session/${mention.session_id}`
                  )
                }
              >
                <CardContentCmp className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    {mention.session_number != null && (
                      <span className={`text-xs font-mono ${mutedText}`}>
                        #{mention.session_number}
                      </span>
                    )}
                    <span className={`text-sm font-medium ${isLeather ? "text-leather" : ""}`}>
                      {mention.session_title}
                    </span>
                  </div>
                  <Badge variant="outline" className={isLeather ? "text-xs capitalize border-leather/40 text-leather" : "text-xs capitalize"}>
                    {mention.mention_type}
                  </Badge>
                </CardContentCmp>
              </CardCmp>
            ))}
          </div>
        </div>
      )}

      {/* Events */}
      {history.events.length > 0 && (
        <div>
          <SectionHeader className={`flex items-center gap-2 ${isLeather ? "!text-leather/70" : ""}`}>
            <Scroll className="size-4 text-gold" />
            Events
          </SectionHeader>
          <div className="space-y-2">
            {history.events.map((event) => (
              <CardCmp key={event.id} className={isLeather ? "" : "grain"}>
                <CardContentCmp className="py-2">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <Badge variant="outline" className={isLeather ? "text-xs capitalize border-leather/40 text-leather" : "text-xs capitalize"}>
                      {event.event_type}
                    </Badge>
                    <Badge variant={isLeather ? "outline" : "secondary"} className={isLeather ? "text-xs border-leather/40 bg-leather/10 text-leather" : "text-xs"}>
                      w{event.weight}
                    </Badge>
                    <Badge variant={isLeather ? "outline" : "secondary"} className={isLeather ? "text-xs capitalize border-leather/40 bg-leather/10 text-leather" : "text-xs capitalize"}>
                      {event.role}
                    </Badge>
                    {event.narrative_day != null && (
                      <span className={`text-xs font-mono ${mutedText}`}>
                        Day {event.narrative_day}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${isLeather ? "text-leather" : ""}`}>
                    {event.summary ?? event.content}
                  </p>
                </CardContentCmp>
              </CardCmp>
            ))}
          </div>
        </div>
      )}

      {/* Conversations */}
      {history.conversations.length > 0 && (
        <div>
          <SectionHeader className={`flex items-center gap-2 ${isLeather ? "!text-leather/70" : ""}`}>
            <MessageSquare className="size-4 text-gold" />
            Conversations
          </SectionHeader>
          <div className="space-y-2">
            {history.conversations.map((conv) => (
              <CardCmp key={conv.id} className={isLeather ? "" : "grain"}>
                <CardContentCmp className="py-2">
                  <p className={`text-sm font-medium ${isLeather ? "text-leather" : ""}`}>
                    {conv.title ?? "Untitled conversation"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {conv.participants.map((p, i) => (
                      <Badge key={i} variant="outline" className={isLeather ? "text-xs border-leather/40 text-leather" : "text-xs"}>
                        {p.name}
                      </Badge>
                    ))}
                    <span className={`text-xs ${mutedText}`}>
                      {conv.turn_count} turns
                    </span>
                  </div>
                </CardContentCmp>
              </CardCmp>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
