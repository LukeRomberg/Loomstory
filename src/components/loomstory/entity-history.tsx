"use client";

import { useTransitionRouter } from "@/hooks/use-transition-router";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
}

export function EntityHistory({ campaignId, history }: EntityHistoryProps) {
  const router = useTransitionRouter();
  const isEmpty =
    history.events.length === 0 &&
    history.conversations.length === 0 &&
    history.session_mentions.length === 0;

  if (isEmpty) {
    return (
      <EmptyState
        icon={Clock}
        tone="leather"
        message="No history yet. This entity hasn't appeared in any sessions, events, or conversations."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Mentions */}
      {history.session_mentions.length > 0 && (
        <div>
          <SectionHeader className="flex items-center gap-2">
            <BookOpen className="size-4 text-gold" />
            Sessions
          </SectionHeader>
          <div className="space-y-2">
            {history.session_mentions.map((mention) => (
              <Card
                key={mention.session_id}
                className="grain gold-glow cursor-pointer"
                onClick={() =>
                  router.push(
                    `/campaign/${campaignId}/session/${mention.session_id}`
                  )
                }
              >
                <CardContent className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    {mention.session_number != null && (
                      <span className="text-xs font-mono text-muted-foreground">
                        #{mention.session_number}
                      </span>
                    )}
                    <span className="text-sm font-medium">
                      {mention.session_title}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">
                    {mention.mention_type}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Events */}
      {history.events.length > 0 && (
        <div>
          <SectionHeader className="flex items-center gap-2">
            <Scroll className="size-4 text-gold" />
            Events
          </SectionHeader>
          <div className="space-y-2">
            {history.events.map((event) => (
              <Card key={event.id} className="grain">
                <CardContent className="py-2">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <Badge variant="outline" className="text-xs capitalize">
                      {event.event_type}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      w{event.weight}
                    </Badge>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {event.role}
                    </Badge>
                    {event.narrative_day != null && (
                      <span className="text-xs text-muted-foreground font-mono">
                        Day {event.narrative_day}
                      </span>
                    )}
                  </div>
                  <p className="text-sm">
                    {event.summary ?? event.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Conversations */}
      {history.conversations.length > 0 && (
        <div>
          <SectionHeader className="flex items-center gap-2">
            <MessageSquare className="size-4 text-gold" />
            Conversations
          </SectionHeader>
          <div className="space-y-2">
            {history.conversations.map((conv) => (
              <Card key={conv.id} className="grain">
                <CardContent className="py-2">
                  <p className="text-sm font-medium">
                    {conv.title ?? "Untitled conversation"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {conv.participants.map((p, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {p.name}
                      </Badge>
                    ))}
                    <span className="text-xs text-muted-foreground">
                      {conv.turn_count} turns
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
