"use client";

import { useState, useMemo } from "react";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, EyeOff, Plus } from "lucide-react";

interface Location {
  id: string;
  name: string;
  aliases: string[] | null;
  description: string | null;
  type: string | null;
  gm_only: boolean;
}

interface LocationListProps {
  campaignId: string;
  campaignName: string;
  locations: Location[];
  role: string;
  userId: string;
}

export function LocationList({
  campaignId,
  campaignName: _campaignName,
  locations: initial,
  role,
  userId,
}: LocationListProps) {
  const router = useTransitionRouter();
  const isGm = role === "gm";
  const [locations] = useState(initial);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    initial[0]?.id ?? null
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return locations;
    const q = search.toLowerCase();
    return locations.filter((l) => {
      const aliasMatch = l.aliases?.some((a) => a.toLowerCase().includes(q));
      return (
        l.name.toLowerCase().includes(q) ||
        aliasMatch ||
        l.description?.toLowerCase().includes(q) ||
        l.type?.toLowerCase().includes(q)
      );
    });
  }, [locations, search]);

  const selected = filtered.find((l) => l.id === selectedId) ?? filtered[0] ?? null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("locations")
      .insert({
        campaign_id: campaignId,
        name,
        created_by: userId,
        updated_by: userId,
        gm_only: true,
      })
      .select()
      .single();
    if (error || !data) {
      toast.error("Failed to create location", { description: error?.message });
      setCreating(false);
      return;
    }
    setCreateOpen(false);
    setName("");
    setCreating(false);
    router.push(`/campaign/${campaignId}/locations/${data.id}`);
  }

  return (
    <>
      <div className="fixed inset-0 z-[45] flex items-center justify-center overflow-hidden bg-leather">
        <div
          className="relative w-[min(100vw,calc(100vh*16/9))]"
          style={{ aspectRatio: "16 / 9" }}
        >
          <Image
            src="/textures/locations-page.png"
            alt=""
            fill
            priority
            className="object-contain"
          />

          {/* Back link (top-left) */}
          <button
            onClick={() => router.push(`/campaign/${campaignId}`)}
            aria-label="Back to bookshelf"
            className="absolute left-[3%] top-[4%] z-10 flex items-center gap-1.5 rounded-md bg-leather/70 px-3 py-1.5 text-gold shadow-lg shadow-black/60 ring-1 ring-gold/20 backdrop-blur-sm transition hover:bg-leather/85 hover:text-gold"
          >
            <ChevronLeft className="size-4" />
            <span className="font-subheading text-sm font-bold uppercase tracking-[0.18em]">
              Bookshelf
            </span>
          </button>

          {/* New location (GM only) */}
          {isGm && (
            <button
              onClick={() => setCreateOpen(true)}
              aria-label="New location"
              className="absolute right-[3%] top-[4%] z-10 flex items-center gap-1.5 rounded-md bg-leather/70 px-3 py-1.5 text-gold shadow-lg shadow-black/60 ring-1 ring-gold/20 backdrop-blur-sm transition hover:bg-leather/85 hover:text-gold"
            >
              <Plus className="size-4" />
              <span className="font-subheading text-sm font-bold uppercase tracking-[0.18em]">
                New
              </span>
            </button>
          )}

          {/* Parchment content overlay */}
          <div
            className="absolute flex flex-col gap-3 font-medium text-leather"
            style={{ left: "18%", right: "18%", top: "13%", bottom: "10%" }}
          >
            {/* Header row */}
            <div className="flex shrink-0 items-center gap-3">
              <h2 className="mr-auto font-heading text-base uppercase tracking-[0.15em] text-leather sm:text-lg">
                Locations{" "}
                <span className="ml-1 font-sans text-xs font-normal text-leather/60 sm:text-sm">
                  ({locations.length})
                </span>
              </h2>
              <Input
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-48 border-leather/30 bg-parchment/30 text-xs text-leather placeholder:text-leather/40"
              />
            </div>

            {/* Master-detail body */}
            <div className="flex min-h-0 flex-1 gap-3">
              {/* Master list */}
              <div className="scrollbar-none w-2/5 overflow-y-auto pr-2">
                {filtered.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-center text-xs italic text-leather/60">
                    {locations.length === 0
                      ? "No locations yet."
                      : "No matches."}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {filtered.map((loc) => (
                      <button
                        key={loc.id}
                        onClick={() => setSelectedId(loc.id)}
                        className={cn(
                          "w-full rounded border border-leather/15 px-3 py-2 text-left transition",
                          "hover:bg-leather/5",
                          selected?.id === loc.id &&
                            "border-leather/40 bg-leather/10"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="line-clamp-1 font-heading text-sm text-leather">
                            {loc.name}
                          </div>
                          {loc.gm_only && (
                            <EyeOff className="size-3.5 shrink-0 text-leather/70" />
                          )}
                        </div>
                        {loc.type && (
                          <div className="mt-0.5 text-xs font-semibold uppercase tracking-[0.1em] text-leather/70">
                            {loc.type}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Detail */}
              <div className="scrollbar-none flex-1 overflow-y-auto border-l border-leather/15 pl-3">
                {selected ? (
                  <LocationDetail
                    location={selected}
                    onOpenFull={() =>
                      router.push(
                        `/campaign/${campaignId}/locations/${selected.id}`
                      )
                    }
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs italic text-leather/60">
                    Select a location to view.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isGm && (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle className="font-heading">New Location</DialogTitle>
                <DialogDescription>
                  Create a location and fill in details on the next page.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="loc-name">Name</Label>
                  <Input
                    id="loc-name"
                    placeholder="Ironhold"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating || !name.trim()}
                  className="gold-glow"
                >
                  {creating ? "Creating..." : "Create Location"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function LocationDetail({
  location,
  onOpenFull,
}: {
  location: Location;
  onOpenFull: () => void;
}) {
  return (
    <div className="space-y-3 pb-3 pr-1">
      <div>
        <h3 className="font-heading text-sm uppercase tracking-[0.12em] text-leather sm:text-base">
          {location.name}
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {location.type && (
            <Badge
              variant="outline"
              className="border-leather/40 text-[11px] font-semibold text-leather"
            >
              {location.type}
            </Badge>
          )}
          {location.gm_only && (
            <Badge variant="secondary" className="text-[11px] font-semibold">
              <EyeOff className="mr-1 size-3" />
              GM Only
            </Badge>
          )}
        </div>
      </div>

      {location.aliases && location.aliases.length > 0 && (
        <div className="text-sm italic text-leather">
          Also known as: {location.aliases.join(", ")}
        </div>
      )}

      {location.description && (
        <p className="whitespace-pre-line text-sm text-leather sm:text-base">
          {location.description}
        </p>
      )}

      <button
        onClick={onOpenFull}
        className="mt-2 inline-flex items-center gap-1 font-subheading text-xs font-semibold uppercase tracking-[0.15em] text-leather/85 transition hover:text-leather"
      >
        Open full details
        <ChevronRight className="size-3.5" />
      </button>
    </div>
  );
}
