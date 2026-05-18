"use client";

import { useState, useRef, useEffect } from "react";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  MessageSquare, Send, Minus, Loader2, Save, Sparkles,
} from "lucide-react";

interface Source {
  entity_type: string;
  entity_id: string;
  name: string;
  chunk: string;
}

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  sources?: Source[];
}

interface CampaignChatbotProps {
  campaignId: string;
  userId: string;
  role: string;
}

const ENTITY_ROUTES: Record<string, string> = {
  npc: "npcs",
  location: "locations",
  faction: "factions",
  item: "items",
  plot_thread: "plot-threads",
  lore_entry: "lore",
  event: "events",
};

export function CampaignChatbot({
  campaignId,
  userId,
  role,
}: CampaignChatbotProps) {
  const router = useTransitionRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current?.scrollIntoView) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput("");

    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      type: "user",
      content: question,
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: campaignId,
          user_id: userId,
          question,
          role,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error("Failed to get answer", { description: err.error });
        setLoading(false);
        return;
      }

      const { answer, sources } = await res.json();

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        type: "ai",
        content: answer,
        sources,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      toast.error("Failed to connect to AI");
    }

    setLoading(false);
  }

  async function handleSave(content: string) {
    toast.success("Save functionality coming soon — will save to lore entries");
  }

  // Use CSS visibility instead of conditional rendering to preserve state
  return (
    <>
      {/* Floating bubble */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open chat"
          className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-gold text-background shadow-lg gold-glow transition-transform hover:scale-105"
        >
          <Sparkles className="size-6" />
        </button>
      )}

      {/* Chat panel — hidden attribute preserves state but hides from DOM queries */}
      <div
        hidden={!open}
        className="fixed bottom-6 right-6 z-50 w-96 max-h-[600px] flex flex-col rounded-xl bg-background border border-border shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-gold" />
            <span className="font-heading text-sm font-medium">Campaign AI</span>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setOpen(false)}
            aria-label="Minimize chat"
          >
            <Minus className="size-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[440px]">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground text-sm font-lore py-8">
              Ask anything about your campaign...
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  msg.type === "user"
                    ? "bg-gold/20 text-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>

                {/* Sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                    <p className="text-xs text-muted-foreground">Sources:</p>
                    <div className="flex flex-wrap gap-1">
                      {msg.sources.map((src, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="text-[10px] cursor-pointer hover:text-gold"
                          onClick={() =>
                            router.push(
                              `/campaign/${campaignId}/${ENTITY_ROUTES[src.entity_type] ?? src.entity_type}/${src.entity_id}`
                            )
                          }
                        >
                          <span className="text-muted-foreground mr-1">{src.entity_type}</span>
                          {src.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Save button */}
                {msg.type === "ai" && (
                  <div className="mt-2 flex justify-end">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleSave(msg.content)}
                      className="text-muted-foreground"
                    >
                      <Save className="size-3 mr-1" />
                      Save
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-3 py-2 text-sm flex items-center gap-2 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Thinking...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 px-4 py-3 border-t border-border"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your campaign..."
            disabled={loading}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={loading || !input.trim()}
            className="gold-glow shrink-0"
          >
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </>
  );
}
