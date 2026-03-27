import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "./user-menu";

export async function AppHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <h1 className="font-heading text-lg font-semibold text-gold tracking-wide">
          Loomstory
        </h1>
        <UserMenu
          displayName={profile?.display_name ?? "Adventurer"}
          avatarUrl={profile?.avatar_url}
        />
      </div>
    </header>
  );
}
