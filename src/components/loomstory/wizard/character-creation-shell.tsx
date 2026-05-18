"use client";

import Image from "next/image";
import { X } from "lucide-react";

interface CharacterCreationShellProps {
  /** Step-progress bar overlay across the top */
  topBar: React.ReactNode;
  /** Left book page — list of choices for the current step */
  leftPage: React.ReactNode;
  /** Right book page — detail / preview of the hovered/selected choice */
  rightPage: React.ReactNode;
  /** Floating parchment sheet — live character sheet that fills in */
  sheetPage: React.ReactNode;
  /** Optional bottom controls (Previous · Step n of m · Continue) */
  footer?: React.ReactNode;
  onClose: () => void;
  /** Toggle hot-pink debug borders so zone positions can be tuned visually. */
  debugBorder?: boolean;
}

// Locked zone positions (percentages of the 1672×941 character-creation.png).
const TOP_BAR_INSET = { left: "4%", right: "4%", top: "3%", bottom: "88%" };
const LEFT_PAGE_INSET = { left: "13%", right: "67%", top: "15%", bottom: "17%" };
const RIGHT_PAGE_INSET = { left: "37%", right: "43%", top: "15%", bottom: "17%" };
const SHEET_PAGE_INSET = { left: "66%", right: "11%", top: "16%", bottom: "16%" };
const FOOTER_INSET = { left: "30%", right: "30%", top: "90%", bottom: "3%" };

export function CharacterCreationShell({
  topBar,
  leftPage,
  rightPage,
  sheetPage,
  footer,
  onClose,
  debugBorder = false,
}: CharacterCreationShellProps) {
  const debug = debugBorder ? { border: "2px solid hotpink" } : {};

  return (
    <div className="fixed inset-0 z-[45] flex items-center justify-center overflow-hidden bg-leather">
      <div
        className="relative w-[min(100vw,calc(100vh*16/9))]"
        style={{ aspectRatio: "16 / 9" }}
      >
        <Image
          src="/textures/character-creation.png"
          alt=""
          fill
          priority
          className="object-contain"
        />

        {/* Close (cancel character creation) */}
        <button
          onClick={onClose}
          aria-label="Close character creation"
          className="absolute right-[3%] top-[4%] z-10 flex items-center gap-1.5 rounded-md bg-leather/70 px-3 py-1.5 text-gold shadow-lg shadow-black/60 ring-1 ring-gold/20 backdrop-blur-sm transition hover:bg-leather/85 hover:text-gold"
        >
          <X className="size-4" />
          <span className="font-subheading text-sm font-bold uppercase tracking-[0.18em]">
            Close
          </span>
        </button>

        {/* TOP zone — step progress bar */}
        <div
          data-testid="creation-top-zone"
          className="absolute flex items-center justify-center text-gold"
          style={{ ...TOP_BAR_INSET, ...debug }}
        >
          {topBar}
        </div>

        {/* LEFT book page — list of choices */}
        <div
          data-testid="creation-left-zone"
          className="absolute flex flex-col gap-3 font-medium text-leather"
          style={{ ...LEFT_PAGE_INSET, ...debug }}
        >
          {leftPage}
        </div>

        {/* RIGHT book page — detail / preview */}
        <div
          data-testid="creation-right-zone"
          className="absolute flex flex-col gap-3 font-medium text-leather"
          style={{ ...RIGHT_PAGE_INSET, ...debug }}
        >
          {rightPage}
        </div>

        {/* SHEET — live character sheet */}
        <div
          data-testid="creation-sheet-zone"
          className="scrollbar-none absolute flex flex-col gap-3 overflow-y-auto font-medium text-leather"
          style={{ ...SHEET_PAGE_INSET, ...debug }}
        >
          {sheetPage}
        </div>

        {/* FOOTER — Prev · Step n of m · Continue */}
        {footer && (
          <div
            data-testid="creation-footer-zone"
            className="absolute flex items-center justify-center gap-3 text-gold"
            style={{ ...FOOTER_INSET, ...debug }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
