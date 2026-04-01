"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { SettingsModal } from "@/components/loomstory/settings-modal";
import { NpcModal } from "@/components/loomstory/npc-modal";
import { LocationModal } from "@/components/loomstory/location-modal";
import { FactionModal } from "@/components/loomstory/faction-modal";
import { ItemModal } from "@/components/loomstory/item-modal";
import { PlotThreadModal } from "@/components/loomstory/plot-thread-modal";
import { LoreModal } from "@/components/loomstory/lore-modal";
import { EventModal } from "@/components/loomstory/event-modal";
import { ConversationModal } from "@/components/loomstory/conversation-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/loomstory/empty-state";
import {
  ChevronLeft,
  Settings,
  Plus,
  ScrollText,
  Scroll,
  MessageSquare,
  Users,
  MapPin,
  Shield,
  Crown,
  GitBranch,
  Sword,
  BookOpen,
  Sparkles,
} from "lucide-react";

interface Session {
  id: string;
  title: string;
  date_played: string | null;
  session_number: number | null;
  status: string;
}

interface CampaignDashboardProps {
  campaign: {
    id: string;
    name: string;
    description: string | null;
    system_id: string | null;
  };
  role: string;
  systemName: string | null;
  sessions: Session[];
  entityCounts: {
    npcs: number;
    locations: number;
    factions: number;
    events: number;
    conversations: number;
    plotThreads: number;
    items: number;
    lore: number;
  };
  userId: string;
}

export function CampaignDashboard({
  campaign,
  role,
  systemName,
  sessions: initialSessions,
  entityCounts,
  userId,
}: CampaignDashboardProps) {
  const router = useRouter();
  const isGm = role === "gm";

  const [sessions, setSessions] = useState(initialSessions);
  const [open, setOpen] = useState(false);
  const [npcModalOpen, setNpcModalOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [factionModalOpen, setFactionModalOpen] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [plotThreadModalOpen, setPlotThreadModalOpen] = useState(false);
  const [loreModalOpen, setLoreModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [conversationModalOpen, setConversationModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [datePlayed, setDatePlayed] = useState("");
  const [sessionNumber, setSessionNumber] = useState("");
  const [creating, setCreating] = useState(false);

  const nextSessionNumber =
    sessions.length > 0
      ? Math.max(...sessions.map((s) => s.session_number ?? 0)) + 1
      : 1;

  async function handleCreateSession(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    const supabase = createClient();

    const { data: session, error: createError } = await supabase
      .from("sessions")
      .insert({
        campaign_id: campaign.id,
        title,
        date_played: datePlayed || null,
        session_number: sessionNumber
          ? parseInt(sessionNumber)
          : nextSessionNumber,
        status: "draft",
        created_by: userId,
      })
      .select()
      .single();

    if (createError || !session) {
      toast.error("Failed to create session", { description: createError?.message });
      setCreating(false);
      return;
    }

    setOpen(false);
    setTitle("");
    setDatePlayed("");
    setSessionNumber("");
    setCreating(false);

    router.push(`/campaign/${campaign.id}/session/${session.id}`);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
          >
            <ChevronLeft className="size-4" />
            Back to campaigns
          </button>
          <h2 className="text-2xl font-heading font-semibold text-foreground">
            {campaign.name}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            {systemName && (
              <Badge variant="outline" className="text-xs">
                {systemName}
              </Badge>
            )}
            <Badge
              variant={isGm ? "default" : "secondary"}
              className="text-xs font-heading"
            >
              <Crown className="size-3 mr-1" />
              {isGm ? "Game Master" : "Player"}
            </Badge>
          </div>
          {campaign.description && (
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              {campaign.description}
            </p>
          )}
        </div>
        {isGm && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="size-4" />
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          className="grain gold-glow cursor-pointer"
          onClick={() => setNpcModalOpen(true)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <Users className="size-4 text-gold" />
              NPCs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{entityCounts.npcs}</p>
          </CardContent>
        </Card>
        <Card
          className="grain gold-glow cursor-pointer"
          onClick={() => setLocationModalOpen(true)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <MapPin className="size-4 text-gold" />
              Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{entityCounts.locations}</p>
          </CardContent>
        </Card>
        <Card
          className="grain gold-glow cursor-pointer"
          onClick={() => setFactionModalOpen(true)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <Shield className="size-4 text-gold" />
              Factions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{entityCounts.factions}</p>
          </CardContent>
        </Card>
        <Card
          className="grain gold-glow cursor-pointer"
          onClick={() => setEventModalOpen(true)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <Scroll className="size-4 text-gold" />
              Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{entityCounts.events}</p>
          </CardContent>
        </Card>
        <Card
          className="grain gold-glow cursor-pointer"
          onClick={() => setConversationModalOpen(true)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <MessageSquare className="size-4 text-gold" />
              Conversations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{entityCounts.conversations}</p>
          </CardContent>
        </Card>
        <Card
          className="grain gold-glow cursor-pointer"
          onClick={() => setPlotThreadModalOpen(true)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <GitBranch className="size-4 text-gold" />
              Plot Threads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{entityCounts.plotThreads}</p>
          </CardContent>
        </Card>
        <Card
          className="grain gold-glow cursor-pointer"
          onClick={() => setItemModalOpen(true)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <Sword className="size-4 text-gold" />
              Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{entityCounts.items}</p>
          </CardContent>
        </Card>
        <Card
          className="grain gold-glow cursor-pointer"
          onClick={() => setLoreModalOpen(true)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <BookOpen className="size-4 text-gold" />
              Lore
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{entityCounts.lore}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading font-medium">Recent Sessions</h3>
          <div className="flex items-center gap-2">
            {isGm && (
              <Button
                size="sm"
                variant="outline"
                className="font-heading"
                onClick={() =>
                  router.push(`/campaign/${campaign.id}/prep`)
                }
              >
                <Sparkles className="size-4 mr-1.5" />
                Session Prep
              </Button>
            )}
            {sessions.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  router.push(`/campaign/${campaign.id}/sessions`)
                }
              >
                View all
              </Button>
            )}
            {isGm && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger
                  render={
                    <Button size="sm" className="gold-glow font-heading">
                      <Plus className="size-4 mr-1.5" />
                      New Session
                    </Button>
                  }
                />
                <DialogContent>
                  <form onSubmit={handleCreateSession}>
                    <DialogHeader>
                      <DialogTitle className="font-heading">
                        New Session
                      </DialogTitle>
                      <DialogDescription>
                        Create a session to start capturing notes.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="session-title">Title</Label>
                        <Input
                          id="session-title"
                          placeholder="The Siege of Ironhold"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="session-number">Session #</Label>
                          <Input
                            id="session-number"
                            type="number"
                            placeholder={String(nextSessionNumber)}
                            value={sessionNumber}
                            onChange={(e) => setSessionNumber(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="date-played">Date Played</Label>
                          <Input
                            id="date-played"
                            type="date"
                            value={datePlayed}
                            onChange={(e) => setDatePlayed(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={creating || !title.trim()}
                        className="gold-glow"
                      >
                        {creating ? "Creating..." : "Create Session"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {sessions.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            message="No sessions yet. Create your first session to start building your story."
            action={
              isGm
                ? { label: "New Session", onClick: () => setOpen(true) }
                : undefined
            }
          />
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <Card
                key={session.id}
                className="grain gold-glow cursor-pointer"
                onClick={() =>
                  router.push(
                    `/campaign/${campaign.id}/session/${session.id}`
                  )
                }
              >
                <CardContent className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    {session.session_number != null && (
                      <span className="text-xs text-muted-foreground font-mono w-8">
                        #{session.session_number}
                      </span>
                    )}
                    <span className="font-medium">{session.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {session.date_played && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(session.date_played).toLocaleDateString()}
                      </span>
                    )}
                    <Badge
                      variant={
                        session.status === "published"
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {session.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Entity Modals */}
      <NpcModal campaignId={campaign.id} userId={userId} role={role} open={npcModalOpen} onOpenChange={setNpcModalOpen} />
      <LocationModal campaignId={campaign.id} userId={userId} role={role} open={locationModalOpen} onOpenChange={setLocationModalOpen} />
      <FactionModal campaignId={campaign.id} userId={userId} role={role} open={factionModalOpen} onOpenChange={setFactionModalOpen} />
      <ItemModal campaignId={campaign.id} userId={userId} role={role} open={itemModalOpen} onOpenChange={setItemModalOpen} />
      <PlotThreadModal campaignId={campaign.id} userId={userId} role={role} open={plotThreadModalOpen} onOpenChange={setPlotThreadModalOpen} />
      <LoreModal campaignId={campaign.id} userId={userId} role={role} open={loreModalOpen} onOpenChange={setLoreModalOpen} />
      <EventModal campaignId={campaign.id} userId={userId} role={role} open={eventModalOpen} onOpenChange={setEventModalOpen} />
      <ConversationModal campaignId={campaign.id} userId={userId} role={role} open={conversationModalOpen} onOpenChange={setConversationModalOpen} />
      {isGm && (
        <SettingsModal campaignId={campaign.id} userId={userId} open={settingsOpen} onOpenChange={setSettingsOpen} />
      )}
    </div>
  );
}
