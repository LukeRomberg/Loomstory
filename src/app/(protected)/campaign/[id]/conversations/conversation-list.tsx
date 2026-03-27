"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/loomstory/empty-state";
import { SectionHeader } from "@/components/loomstory/section-header";
import { ChevronLeft, MessageSquare, ChevronDown, ChevronUp, EyeOff } from "lucide-react";

interface Turn {
  speaker: string;
  text: string;
  tone: string;
}

interface Participant {
  entity_id: string | null;
  entity_type: string;
  name: string;
}

interface Conversation {
  id: string;
  session_id: string | null;
  event_id: string | null;
  title: string | null;
  participants: Participant[];
  content: Turn[];
  content_plain: string | null;
  gm_notes: string | null;
  gm_only: boolean;
  created_at: string;
}

interface Session {
  id: string;
  title: string;
  session_number: number | null;
}

interface ConversationListProps {
  campaignId: string;
  campaignName: string;
  conversations: Conversation[];
  sessions: Session[];
  role: string;
}

export function ConversationList({
  campaignId,
  campaignName,
  conversations,
  sessions,
  role,
}: ConversationListProps) {
  const router = useRouter();
  const isGm = role === "gm";
  const [sessionFilter, setSessionFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = conversations;
    if (sessionFilter !== "all") {
      result = result.filter((c) => c.session_id === sessionFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => {
        const participantMatch = c.participants.some((p) =>
          p.name.toLowerCase().includes(q)
        );
        const titleMatch = c.title?.toLowerCase().includes(q);
        const contentMatch = c.content_plain?.toLowerCase().includes(q);
        return participantMatch || titleMatch || contentMatch;
      });
    }
    return result;
  }, [conversations, sessionFilter, search]);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <button
            onClick={() => router.push(`/campaign/${campaignId}`)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
          >
            <ChevronLeft className="size-4" />
            {campaignName}
          </button>
          <h2 className="text-2xl font-heading font-semibold">Conversations</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {conversations.length} conversation{conversations.length !== 1 ? "s" : ""} in this campaign
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Input
          placeholder="Search by participant or content..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-[250px]"
        />
        <Select value={sessionFilter} onValueChange={(v) => setSessionFilter(v ?? "all")}>
          <SelectTrigger className="w-[200px]">
            <SelectValue>
              {sessionFilter === "all" ? "All Sessions" : sessions.find((s) => s.id === sessionFilter)?.title ?? "Unknown"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sessions</SelectItem>
            {sessions.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Conversation List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          message={conversations.length === 0 ? "No conversations yet. Process a session to extract dialogues." : "No conversations match the current filters."}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((conv) => (
            <ConversationCard key={conv.id} conversation={conv} isGm={isGm} />
          ))}
        </div>
      )}
    </div>
  );
}

function ConversationCard({
  conversation,
  isGm,
}: {
  conversation: Conversation;
  isGm: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const turns = conversation.content ?? [];
  const previewTurns = turns.slice(0, 2);
  const hasMore = turns.length > 2;

  return (
    <Card className="grain">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-heading text-base">
              {conversation.title ?? "Untitled conversation"}
            </CardTitle>
            <div className="flex items-center gap-1.5 mt-1">
              {conversation.participants.map((p, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {p.name}
                </Badge>
              ))}
              {conversation.gm_only && (
                <Badge variant="secondary" className="text-xs">
                  <EyeOff className="size-3 mr-1" />
                  GM Only
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Dialogue turns */}
        <div className="space-y-1.5 border-l-2 border-gold/30 pl-3">
          {(expanded ? turns : previewTurns).map((turn, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">
                {turn.tone}
              </Badge>
              <p>
                <span className="font-medium text-foreground">{turn.speaker}:</span>{" "}
                <span className="text-muted-foreground">{turn.text}</span>
              </p>
            </div>
          ))}
        </div>

        {hasMore && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground"
          >
            {expanded ? (
              <>
                <ChevronUp className="size-3 mr-1" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="size-3 mr-1" />
                {turns.length - 2} more turn{turns.length - 2 !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        )}

        {/* GM Notes */}
        {isGm && conversation.gm_notes && (
          <div className="mt-2 pt-2 border-t border-border">
            <SectionHeader>GM Notes</SectionHeader>
            <p className="text-xs text-muted-foreground italic">{conversation.gm_notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
