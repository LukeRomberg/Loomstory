"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/loomstory/empty-state";
import { Plus, ScrollText, Crown, User } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  system_id: string | null;
  created_at: string;
  role: string;
}

interface System {
  id: string;
  name: string;
  slug: string;
}

interface CampaignListProps {
  campaigns: Campaign[];
  systems: System[];
  userId: string;
}

export function CampaignList({
  campaigns: initialCampaigns,
  systems,
  userId,
}: CampaignListProps) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemId, setSystemId] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    const supabase = createClient();

    // Create campaign
    const { data: campaign, error: createError } = await supabase
      .from("campaigns")
      .insert({
        name,
        description: description || null,
        system_id: systemId || null,
        created_by: userId,
      })
      .select()
      .single();

    if (createError || !campaign) {
      toast.error("Failed to create campaign", { description: createError?.message });
      setCreating(false);
      return;
    }

    // Add creator as GM
    await supabase.from("campaign_members").insert({
      campaign_id: campaign.id,
      user_id: userId,
      role: "gm",
    });

    // Add to local state and navigate
    setCampaigns((prev) => [
      { ...campaign, role: "gm" },
      ...prev,
    ]);

    setOpen(false);
    setName("");
    setDescription("");
    setSystemId("");
    setCreating(false);

    router.push(`/campaign/${campaign.id}`);
  }

  function getSystemName(systemId: string | null) {
    if (!systemId) return null;
    return systems.find((s) => s.id === systemId)?.name ?? null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-heading font-semibold text-foreground">
            Your Campaigns
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Select a campaign or create a new one.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button className="gold-glow font-heading">
                <Plus className="size-4 mr-1.5" />
                New Campaign
              </Button>
            }
          />
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle className="font-heading">
                  Create a Campaign
                </DialogTitle>
                <DialogDescription>
                  Set up a new campaign for your table.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign-name">Campaign Name</Label>
                  <Input
                    id="campaign-name"
                    placeholder="The Crimson Accord"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campaign-system">Rule System</Label>
                  <Select value={systemId} onValueChange={(v) => setSystemId(v ?? "")}>
                    <SelectTrigger id="campaign-system">
                      <SelectValue placeholder="Select a system...">
                        {systemId
                          ? systems.find((s) => s.id === systemId)?.name
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {systems.map((system) => (
                        <SelectItem key={system.id} value={system.id}>
                          {system.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campaign-desc">Description</Label>
                  <Textarea
                    id="campaign-desc"
                    placeholder="A brief description of your campaign..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
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
                  disabled={creating || !name.trim()}
                  className="gold-glow"
                >
                  {creating ? "Creating..." : "Create Campaign"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {campaigns.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          message="No campaigns yet. Create your first one to get started."
          action={{
            label: "Create Campaign",
            onClick: () => setOpen(true),
          }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <Card
              key={campaign.id}
              className="grain gold-glow cursor-pointer transition-all hover:ring-gold/30"
              onClick={() => router.push(`/campaign/${campaign.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="font-heading">
                    {campaign.name}
                  </CardTitle>
                  <Badge
                    variant={
                      campaign.role === "gm" ? "default" : "secondary"
                    }
                    className="text-xs font-heading shrink-0 ml-2"
                  >
                    {campaign.role === "gm" ? (
                      <>
                        <Crown className="size-3 mr-1" />
                        GM
                      </>
                    ) : (
                      <>
                        <User className="size-3 mr-1" />
                        Player
                      </>
                    )}
                  </Badge>
                </div>
                {campaign.description && (
                  <CardDescription className="line-clamp-2">
                    {campaign.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {getSystemName(campaign.system_id) && (
                    <Badge variant="outline" className="text-xs">
                      {getSystemName(campaign.system_id)}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
