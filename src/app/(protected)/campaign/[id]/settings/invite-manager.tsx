"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Copy, Link, Trash2, UserPlus } from "lucide-react";

interface Invite {
  id: string;
  campaign_id: string;
  email: string | null;
  token: string;
  role: string;
  created_by: string;
  expires_at: string | null;
  accepted_at: string | null;
  created_at: string;
}

interface InviteManagerProps {
  campaignId: string;
  invites: Invite[];
  userId: string;
}

export function InviteManager({
  campaignId,
  invites: initialInvites,
  userId,
}: InviteManagerProps) {
  const router = useRouter();
  const [invites, setInvites] = useState<Invite[]>(initialInvites);
  const [createOpen, setCreateOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<Invite | null>(null);
  const [revoking, setRevoking] = useState(false);

  async function handleCreate() {
    setCreating(true);
    const supabase = createClient();

    const token = crypto.randomUUID();
    const { data, error } = await supabase
      .from("campaign_invites")
      .insert({
        campaign_id: campaignId,
        email: email.trim() || null,
        token,
        role: "player",
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create invite", { description: error.message });
      setCreating(false);
      return;
    }

    setInvites((prev) => [...prev, data]);
    setEmail("");
    setCreateOpen(false);
    setCreating(false);
    toast.success("Invite created");
  }

  async function handleRevoke(invite: Invite) {
    setRevoking(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("campaign_invites")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invite.id);

    if (error) {
      toast.error("Failed to revoke invite", { description: error.message });
      setRevoking(false);
      return;
    }

    setInvites((prev) => prev.filter((i) => i.id !== invite.id));
    setRevokeTarget(null);
    setRevoking(false);
    toast.success("Invite revoked");
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied");
  }

  function formatExpiry(expiresAt: string | null) {
    if (!expiresAt) return "No expiration";
    const date = new Date(expiresAt);
    return `Expires ${date.toLocaleDateString()}`;
  }

  return (
    <Card className="grain">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-heading">Invites</CardTitle>
            <CardDescription>
              {invites.length > 0
                ? `${invites.length} pending`
                : "No pending invites"}
            </CardDescription>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger
              render={
                <Button variant="outline" size="sm" className="gold-glow">
                  <UserPlus className="size-4 mr-1.5" />
                  Create Invite
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Invite</DialogTitle>
                <DialogDescription>
                  Send a direct invite or create a shareable link.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">
                    Email <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="player@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave blank to create a shareable invite link.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={creating}
                  className="gold-glow"
                >
                  {creating ? "Sending..." : "Send Invite"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {invites.length === 0 ? (
          <p className="text-sm text-muted-foreground font-lore">
            No pending invites. Create one to invite players to your campaign.
          </p>
        ) : (
          <div className="space-y-3">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between rounded-md border border-border/50 p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Link className="size-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {invite.email ?? "Open invite"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatExpiry(invite.expires_at)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {invite.role}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyLink(invite.token)}
                    aria-label="Copy link"
                  >
                    <Copy className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRevokeTarget(invite)}
                    aria-label="Revoke"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Revoke confirmation dialog */}
        <Dialog
          open={!!revokeTarget}
          onOpenChange={(open) => !open && setRevokeTarget(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Revoke Invite</DialogTitle>
              <DialogDescription>
                This invite link will no longer work. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setRevokeTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => revokeTarget && handleRevoke(revokeTarget)}
                disabled={revoking}
              >
                {revoking ? "Revoking..." : "Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
