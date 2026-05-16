"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { Library } from "@/components/shared/library";
import { Bookshelf } from "@/components/shared/bookshelf";
import { BookSpine } from "@/components/shared/book-spine";
import { NewCampaignBook } from "@/components/shared/new-campaign-book";
import { IlluminatedHeading } from "@/components/shared/illuminated-heading";
import { CAMPAIGN_SECTIONS } from "@/lib/sections";

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

  function getSystemName(sId: string | null) {
    if (!sId) return null;
    return systems.find((s) => s.id === sId)?.name ?? null;
  }

  return (
    <>
      <Library>
        <header className="text-center">
          <IlluminatedHeading level={1}>Campaign Journals</IlluminatedHeading>
          <p className="mt-3 font-lore italic text-gold/70 sm:text-lg">
            Choose your adventure.
          </p>
        </header>

        {campaigns.length === 0 ? (
          <Bookshelf campaignName="Begin Your First Tale">
            <NewCampaignBook onClick={() => setOpen(true)} />
          </Bookshelf>
        ) : (
          <>
            {campaigns.map((campaign) => {
              const systemName = getSystemName(campaign.system_id);
              const roleLabel = campaign.role === "gm" ? "Game Master" : "Player";
              const subtitle = [systemName, roleLabel].filter(Boolean).join(" · ");

              return (
                <Bookshelf
                  key={campaign.id}
                  campaignName={campaign.name}
                  subtitle={subtitle}
                >
                  <Link
                    href={`/campaign/${campaign.id}`}
                    className="self-center font-subheading text-[10px] uppercase tracking-[0.18em] text-gold/70 hover:text-gold mr-2"
                  >
                    Enter →
                  </Link>
                  {CAMPAIGN_SECTIONS.map((section) => (
                    <BookSpine
                      key={section.slug}
                      title={section.title}
                      color={section.color}
                      emblem={section.emblem}
                      href={`/campaign/${campaign.id}/${section.slug}`}
                    />
                  ))}
                </Bookshelf>
              );
            })}

            <Bookshelf campaignName="Begin Anew">
              <NewCampaignBook onClick={() => setOpen(true)} />
            </Bookshelf>
          </>
        )}
      </Library>

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
