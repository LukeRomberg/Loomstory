"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CampaignChatbot } from "./campaign-chatbot";

/**
 * Wrapper that shows the chatbot only on campaign pages.
 * Extracts campaignId from the URL path and fetches the user's role.
 */
export function ChatbotWrapper() {
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  // Extract campaign ID from path: /campaign/{id}/...
  const campaignMatch = pathname.match(/\/campaign\/([a-f0-9-]+)/);
  const campaignId = campaignMatch?.[1] ?? null;

  useEffect(() => {
    if (!campaignId) return;

    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: membership } = await supabase
        .from("campaign_members")
        .select("role")
        .eq("campaign_id", campaignId)
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .single();

      setRole(membership?.role ?? null);
    }

    load();
  }, [campaignId]);

  if (!campaignId || !userId || !role) return null;

  return (
    <CampaignChatbot
      campaignId={campaignId}
      userId={userId}
      role={role}
    />
  );
}
