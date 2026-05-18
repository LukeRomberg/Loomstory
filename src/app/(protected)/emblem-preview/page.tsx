"use client";

import { Icon } from "@iconify/react";
import { EMBLEMS } from "@/components/shared/campaign-select-image";

// Throwaway preview route — renders the current EMBLEMS rotation so the
// user can pick which to keep vs swap. Delete once the set is locked.
export default function EmblemPreviewPage() {
  return (
    <div className="min-h-screen bg-leather py-10">
      <div className="mx-auto max-w-5xl px-4">
        <h1 className="font-heading text-2xl font-bold uppercase tracking-[0.18em] text-gold">
          Campaign book emblems
        </h1>
        <p className="mt-1 text-sm text-gold/70">
          {EMBLEMS.length} icons currently in the rotation. Tell me which slot
          numbers to swap and what to replace them with.
        </p>

        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {EMBLEMS.map((name, i) => (
            <li
              key={name}
              className="flex flex-col items-center gap-3 rounded-md border border-gold/30 bg-black/40 p-4 shadow-lg shadow-black/40"
            >
              <span className="font-mono text-xs font-bold text-gold/60">
                #{i + 1}
              </span>
              <Icon icon={name} className="size-16 text-gold" />
              <span className="break-all text-center font-mono text-[11px] text-gold/80">
                {name}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
