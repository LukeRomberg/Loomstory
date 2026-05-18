"use client";

import { useState, useMemo, useCallback } from "react";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MasterList,
  MasterListItem,
} from "@/components/shared/master-list";
import { LocationDetail } from "./location-detail";
import { ChevronLeft, Plus } from "lucide-react";

interface Location {
  id: string;
  name: string;
  aliases: string[] | null;
  description: string | null;
  type: string | null;
  gm_notes: string | null;
  player_notes: string | null;
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
  const searchParams = useSearchParams();
  const isGm = role === "gm";
  const [locations, setLocations] = useState(initial);
  const [search, setSearch] = useState("");
  const urlSelected = searchParams.get("selected");
  const [selectedId, setSelectedId] = useState<string | null>(
    urlSelected ?? initial[0]?.id ?? null
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

  const selected =
    filtered.find((l) => l.id === selectedId) ?? filtered[0] ?? null;

  const selectLocation = useCallback(
    (id: string) => {
      setSelectedId(id);
      router.replace(`/campaign/${campaignId}/locations?selected=${id}`);
    },
    [campaignId, router]
  );

  const handleDeleted = useCallback(() => {
    if (!selected) return;
    const remaining = locations.filter((l) => l.id !== selected.id);
    setLocations(remaining);
    setSelectedId(remaining[0]?.id ?? null);
  }, [locations, selected]);

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
    const created: Location = {
      id: data.id,
      name: data.name,
      aliases: null,
      description: null,
      type: null,
      gm_notes: null,
      player_notes: null,
      gm_only: true,
      ...data,
    };
    setLocations((prev) => [...prev, created]);
    selectLocation(created.id);
    setCreateOpen(false);
    setName("");
    setCreating(false);
    toast.success("Location created");
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
            className="absolute flex gap-3 font-medium text-leather"
            style={{ left: "18%", right: "18%", top: "13%", bottom: "10%" }}
          >
            {/* Master list */}
            <div className="flex w-2/5 flex-col gap-3 pr-2">
              <MasterList
                title="Locations"
                count={locations.length}
                search={search}
                onSearchChange={setSearch}
                isEmpty={filtered.length === 0}
                emptyMessage={
                  locations.length === 0 ? "No locations yet." : "No matches."
                }
              >
                {filtered.map((loc) => (
                  <MasterListItem
                    key={loc.id}
                    selected={selected?.id === loc.id}
                    onClick={() => selectLocation(loc.id)}
                    title={loc.name}
                    hidden={loc.gm_only}
                    subtitle={loc.type ?? undefined}
                  />
                ))}
              </MasterList>
            </div>

            {/* Detail */}
            <div className="flex-1 border-l border-leather/15 pl-3">
              {selected ? (
                <LocationDetail
                  key={selected.id}
                  campaignId={campaignId}
                  location={selected}
                  role={role}
                  userId={userId}
                  onDeleted={handleDeleted}
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

      {isGm && (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle className="font-heading">New Location</DialogTitle>
                <DialogDescription>
                  Create a location and fill in details inline.
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
