import Image from "next/image";
import Link from "next/link";
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
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Image
            src="/brand/loomstory-monogram.png"
            alt=""
            width={36}
            height={36}
            priority
            className="h-8 w-auto"
          />
          <h1 className="font-heading text-lg font-semibold text-gold tracking-wide">
            Loomstory
          </h1>
        </Link>
        <UserMenu
          displayName={profile?.display_name ?? "Adventurer"}
          avatarUrl={profile?.avatar_url}
        />
      </div>
    </header>
  );
}
