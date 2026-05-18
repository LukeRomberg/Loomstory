"use client";

import { useState, useEffect, useCallback } from "react";
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
import { SkeletonList } from "@/components/shared/skeleton-card";
import { PlayerList } from "@/app/(protected)/campaign/[id]/settings/player-list";
import { InviteManager } from "@/app/(protected)/campaign/[id]/settings/invite-manager";
import { Trash2 } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────

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

interface SettingsModalProps {
  campaignId: string;
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({
  campaignId,
  userId,
  open,
  onOpenChange,
}: SettingsModalProps) {
  const router = useTransitionRouter();
  const [loading, setLoading] = useState(true);

  // General settings state
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [systems, setSystems] = useState<System[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemId, setSystemId] = useState("");
  const [houseRules, setHouseRules] = useState("");
  const [saving, setSaving] = useState(false);

  // Members & invites (passed to reusable components)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [members, setMembers] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [invites, setInvites] = useState<any[]>([]);

  // Archive state
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);

  // ─── Data Fetching ────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const [campaignRes, systemsRes, membersRes, invitesRes] = await Promise.all([
      supabase
        .from("campaigns")
        .select("id, name, description, system_id, house_rules, cover_image_url")
        .eq("id", campaignId)
        .is("deleted_at", null)
        .single(),
      supabase
        .from("systems")
        .select("id, name, slug")
        .order("name"),
      supabase
        .from("campaign_members")
        .select("id, campaign_id, user_id, role, joined_at, profiles(id, display_name, avatar_url)")
        .eq("campaign_id", campaignId)
        .is("deleted_at", null)
        .order("joined_at"),
      supabase
        .from("campaign_invites")
        .select("*")
        .eq("campaign_id", campaignId)
        .is("accepted_at", null)
        .order("created_at", { ascending: false }),
    ]);

    if (campaignRes.data) {
      setCampaign(campaignRes.data);
      setName(campaignRes.data.name);
      setDescription(campaignRes.data.description ?? "");
      setSystemId(campaignRes.data.system_id ?? "");
      setHouseRules(campaignRes.data.house_rules ?? "");
    }
    setSystems(systemsRes.data ?? []);
    // Flatten profiles join (Supabase returns array without generated types)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flatMembers = (membersRes.data ?? []).map((m: any) => ({
      ...m,
      profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles,
    }));
    setMembers(flatMembers);
    setInvites(invitesRes.data ?? []);
    setLoading(false);
  }, [campaignId]);

  useEffect(() => {
    if (open) fetchData();
  }, [open, fetchData]);

  // ─── General Settings Handler ─────────────────────────────

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("campaigns")
      .update({
        name,
        description: description || null,
        system_id: systemId || null,
        house_rules: houseRules || null,
      })
      .eq("id", campaignId);

    if (error) {
      toast.error("Failed to save", { description: error.message });
      setSaving(false);
      return;
    }

    toast.success("Settings saved");
    setSaving(false);
    router.refresh();
  }

  // ─── Archive Handler ──────────────────────────────────────

  async function handleArchive() {
    setArchiving(true);
    const supabase = createClient();

    const { error } = await supabase
      .rpc("soft_delete_entity", { p_entity_type: "campaign", p_entity_id: campaignId });

    if (error) {
      toast.error("Failed to archive", { description: error.message });
      setArchiving(false);
      return;
    }

    toast.success("Campaign archived");
    onOpenChange(false);
    router.push("/dashboard");
    router.refresh();
  }

  // ─── Render ───────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            Campaign Settings
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <SkeletonList count={3} />
        ) : (
          <div className="space-y-6">
            {/* ── General Settings ──────────────────────── */}
            <Card className="grain">
              <form onSubmit={handleSave}>
                <CardHeader>
                  <CardTitle className="font-heading">General</CardTitle>
                  <CardDescription>Update your campaign details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="settings-name">Campaign Name</Label>
                    <Input
                      id="settings-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-system">Rule System</Label>
                    <Select value={systemId} onValueChange={(v) => setSystemId(v ?? "")}>
                      <SelectTrigger id="settings-system">
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
                    <Label htmlFor="settings-desc">Description</Label>
                    <Textarea
                      id="settings-desc"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-rules">House Rules</Label>
                    <Textarea
                      id="settings-rules"
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

            {/* ── Members (reusable component) ────────── */}
            <PlayerList
              campaignId={campaignId}
              members={members}
              currentUserId={userId}
            />

            {/* ── Invites (reusable component) ────────── */}
            <InviteManager
              campaignId={campaignId}
              invites={invites}
              userId={userId}
            />

            {/* ── Danger Zone ─────────────────────────── */}
            <Separator />
            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="font-heading text-red-400">Danger Zone</CardTitle>
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
                      <DialogTitle>Archive &quot;{campaign?.name}&quot;?</DialogTitle>
                      <DialogDescription>
                        This will hide the campaign from your dashboard. All data is
                        preserved and can be recovered later.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setArchiveOpen(false)}>
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
        )}
      </DialogContent>
    </Dialog>
  );
}
