"use client";

import { useState } from "react";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, Clock, XCircle } from "lucide-react";

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
  campaigns: { id: string; name: string };
}

interface AcceptInviteProps {
  invite: Invite;
  userId: string;
}

export function AcceptInvite({ invite, userId }: AcceptInviteProps) {
  const router = useTransitionRouter();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isExpired =
    invite.expires_at && new Date(invite.expires_at) < new Date();
  const isAccepted = !!invite.accepted_at;

  async function handleAccept() {
    setJoining(true);
    setError(null);
    const supabase = createClient();

    // Create membership
    const { error: memberError } = await supabase
      .from("campaign_members")
      .insert({
        campaign_id: invite.campaign_id,
        user_id: userId,
        role: invite.role,
      })
      .select()
      .single();

    if (memberError) {
      setError(memberError.message);
      setJoining(false);
      return;
    }

    // Mark invite as accepted
    await supabase
      .from("campaign_invites")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invite.id);

    toast.success(`Joined ${invite.campaigns.name}`);
    router.push(`/campaign/${invite.campaign_id}`);
    router.refresh();
  }

  function handleDecline() {
    router.push("/dashboard");
  }

  // ─── Already accepted ────────────────────────────────
  if (isAccepted) {
    return (
      <Card className="grain max-w-md mx-auto">
        <CardHeader className="text-center">
          <CheckCircle className="size-10 text-green-500 mx-auto mb-2" />
          <CardTitle className="font-heading">Invite Already Used</CardTitle>
          <CardDescription>
            This invite has already been accepted.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button onClick={() => router.push("/dashboard")} className="gold-glow">
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // ─── Expired ──────────────────────────────────────────
  if (isExpired) {
    return (
      <Card className="grain max-w-md mx-auto">
        <CardHeader className="text-center">
          <Clock className="size-10 text-muted-foreground mx-auto mb-2" />
          <CardTitle className="font-heading">Invite Expired</CardTitle>
          <CardDescription>
            This invite has expired. Ask the GM for a new one.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button onClick={() => router.push("/dashboard")} className="gold-glow">
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // ─── Valid invite ─────────────────────────────────────
  return (
    <Card className="grain max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="font-heading text-xl">
          You&apos;ve Been Invited!
        </CardTitle>
        <CardDescription>
          Join <span className="font-medium text-foreground">{invite.campaigns.name}</span> as a
        </CardDescription>
        <Badge variant="secondary" className="mx-auto mt-1 w-fit">
          {invite.role}
        </Badge>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <XCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-3 justify-center">
        <Button variant="ghost" onClick={handleDecline}>
          Decline
        </Button>
        <Button
          onClick={handleAccept}
          disabled={joining}
          className="gold-glow"
        >
          {joining ? "Joining..." : "Join Campaign"}
        </Button>
      </CardFooter>
    </Card>
  );
}
