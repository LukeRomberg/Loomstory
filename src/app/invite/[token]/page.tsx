import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AcceptInvite } from "./accept-invite";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  // Check if user is logged in — redirect to login with return URL if not
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/invite/${token}`);
  }

  // Look up invite by token
  const { data: invite } = await supabase
    .from("campaign_invites")
    .select("*, campaigns:campaign_id(id, name)")
    .eq("token", token)
    .single();

  if (!invite) notFound();

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <AcceptInvite invite={invite} userId={user.id} />
    </div>
  );
}
