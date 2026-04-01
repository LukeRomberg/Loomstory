"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dialog";
import { IconButton } from "@/components/shared/icon-button";
import { UserMinus, Users } from "lucide-react";

interface Member {
  id: string;
  campaign_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles: { id: string; display_name: string | null; avatar_url: string | null };
}

interface PlayerListProps {
  campaignId: string;
  members: Member[];
  currentUserId: string;
}

export function PlayerList({
  campaignId,
  members: initialMembers,
  currentUserId,
}: PlayerListProps) {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);
  const [removing, setRemoving] = useState(false);

  const players = members.filter((m) => m.role !== "gm");

  async function handleRemove(member: Member) {
    setRemoving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("campaign_members")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", member.id);

    if (error) {
      toast.error("Failed to remove player", { description: error.message });
      setRemoving(false);
      return;
    }

    setMembers((prev) => prev.filter((m) => m.id !== member.id));
    setRemoveTarget(null);
    setRemoving(false);
    toast.success(`${member.profiles.display_name ?? "Player"} removed`);
  }

  return (
    <Card className="grain">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="size-5 text-muted-foreground" />
          <div>
            <CardTitle className="font-heading">Members</CardTitle>
            <CardDescription>
              {members.length} member{members.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              data-member
              className="flex items-center justify-between rounded-md border border-border/50 p-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {member.profiles.display_name ?? "Unknown"}
                    {member.user_id === currentUserId && (
                      <span className="text-xs text-muted-foreground ml-1.5">
                        (You)
                      </span>
                    )}
                  </p>
                </div>
                <Badge variant="secondary">{member.role}</Badge>
              </div>
              {member.role !== "gm" && (
                <IconButton
                  icon={UserMinus}
                  label="Remove"
                  variant="destructive"
                  onClick={() => setRemoveTarget(member)}
                />
              )}
            </div>
          ))}
        </div>

        {players.length === 0 && (
          <p className="text-sm text-muted-foreground font-lore mt-3">
            No players yet. Send an invite to get started.
          </p>
        )}

        {/* Remove confirmation dialog */}
        <Dialog
          open={!!removeTarget}
          onOpenChange={(open) => !open && setRemoveTarget(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Remove {removeTarget?.profiles.display_name ?? "Player"}?
              </DialogTitle>
              <DialogDescription>
                They will lose access to this campaign. You can re-invite them later.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setRemoveTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => removeTarget && handleRemove(removeTarget)}
                disabled={removing}
              >
                {removing ? "Removing..." : "Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
