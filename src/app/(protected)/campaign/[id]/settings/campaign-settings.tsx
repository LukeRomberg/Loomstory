"use client";

import { useState } from "react";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, Trash2 } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  system_id: string | null;
  house_rules: string | null;
  cover_image_url: string | null;
}

interface System {
  id: string;
  name: string;
  slug: string;
}

interface CampaignSettingsProps {
  campaign: Campaign;
  systems: System[];
}

export function CampaignSettings({
  campaign,
  systems,
}: CampaignSettingsProps) {
  const router = useTransitionRouter();
  const [name, setName] = useState(campaign.name);
  const [description, setDescription] = useState(campaign.description ?? "");
  const [systemId, setSystemId] = useState(campaign.system_id ?? "");
  const [houseRules, setHouseRules] = useState(campaign.house_rules ?? "");
  const [saving, setSaving] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("campaigns")
      .update({
        name,
        description: description || null,
        system_id: systemId || null,
        house_rules: houseRules || null,
      })
      .eq("id", campaign.id);

    if (updateError) {
      toast.error("Failed to save", { description: updateError.message });
      setSaving(false);
      return;
    }

    toast.success("Settings saved");
    setSaving(false);
  }

  async function handleArchive() {
    setArchiving(true);
    const supabase = createClient();

    const { error: archiveError } = await supabase
      .rpc("soft_delete_entity", { p_entity_type: "campaign", p_entity_id: campaign.id });

    if (archiveError) {
      toast.error("Failed to archive", { description: archiveError.message });
      setArchiving(false);
      return;
    }

    toast.success("Campaign archived");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <button
          onClick={() => router.push(`/campaign/${campaign.id}`)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
        >
          <ChevronLeft className="size-4" />
          Back to campaign
        </button>
        <h2 className="text-2xl font-heading font-semibold">
          Campaign Settings
        </h2>
      </div>

      <Card className="grain">
        <form onSubmit={handleSave}>
          <CardHeader>
            <CardTitle className="font-heading">General</CardTitle>
            <CardDescription>
              Update your campaign details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="system">Rule System</Label>
              <Select value={systemId} onValueChange={(v) => setSystemId(v ?? "")}>
                <SelectTrigger id="system">
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="house-rules">House Rules</Label>
              <Textarea
                id="house-rules"
                placeholder="Any special rules for your table..."
                value={houseRules}
                onChange={(e) => setHouseRules(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              disabled={saving || !name.trim()}
              className="gold-glow"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Separator />

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="font-heading text-red-400">
            Danger Zone
          </CardTitle>
          <CardDescription>
            Archive this campaign. It can be recovered later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
            <DialogTrigger
              render={
                <Button variant="destructive">
                  <Trash2 className="size-4 mr-1.5" />
                  Archive Campaign
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Archive &quot;{campaign.name}&quot;?</DialogTitle>
                <DialogDescription>
                  This will hide the campaign from your dashboard. All data is
                  preserved and can be recovered later.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setArchiveOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleArchive}
                  disabled={archiving}
                >
                  {archiving ? "Archiving..." : "Archive"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
