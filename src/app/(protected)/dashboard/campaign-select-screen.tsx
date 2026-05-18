"use client";

import { useMemo, useState } from "react";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { CampaignSelectImage } from "@/components/shared/campaign-select-image";

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

interface CampaignSelectScreenProps {
  campaigns: Campaign[];
  systems: System[];
  userId: string;
}

export function CampaignSelectScreen({
  campaigns: initialCampaigns,
  systems,
  userId,
}: CampaignSelectScreenProps) {
  const router = useTransitionRouter();
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [page, setPage] = useState(0);

  const systemNameById = useMemo(
    () => new Map(systems.map((s) => [s.id, s.name])),
    [systems]
  );
  const summaries = useMemo(
    () =>
      campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        role: c.role,
        systemName: c.system_id
          ? systemNameById.get(c.system_id)
          : undefined,
      })),
    [campaigns, systemNameById]
  );
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemId, setSystemId] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    const supabase = createClient();

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
      toast.error("Failed to create campaign", {
        description: createError?.message,
      });
      setCreating(false);
      return;
    }

    await supabase.from("campaign_members").insert({
      campaign_id: campaign.id,
      user_id: userId,
      role: "gm",
    });

    setCampaigns((prev) => [{ ...campaign, role: "gm" }, ...prev]);

    setOpen(false);
    setName("");
    setDescription("");
    setSystemId("");
    setCreating(false);

    router.push(`/campaign/${campaign.id}`);
  }

  return (
    <>
      <div className="fixed inset-0 z-[45] flex items-center justify-center overflow-hidden bg-leather">
        <CampaignSelectImage
          className="w-[min(100vw,calc(100vh*16/9))]"
          campaigns={summaries}
          page={page}
          onPageChange={setPage}
          onCreateCampaign={() => setOpen(true)}
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
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
                <Select
                  value={systemId}
                  onValueChange={(v) => setSystemId(v ?? "")}
                >
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
    </>
  );
}
