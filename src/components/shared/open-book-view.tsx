"use client";

import Image from "next/image";
import { ChevronLeft, Plus } from "lucide-react";

interface OpenBookViewProps {
  leftPage: React.ReactNode;
  rightPage: React.ReactNode;
  onBack: () => void;
  backLabel?: string;
  onNew?: () => void;
  newLabel?: string;
  newAriaLabel?: string;
  children?: React.ReactNode;
  /** Toggle hot-pink debug borders on the two page overlays so positions can be tuned. */
  debugBorder?: boolean;
}

// Locked parchment-overlay positions for open-book.png (1672×941, 16:9).
const LEFT_INSET = { left: "11%", right: "52%", top: "8%", bottom: "8%" };
const RIGHT_INSET = { left: "52%", right: "12%", top: "8%", bottom: "8%" };

export function OpenBookView({
  leftPage,
  rightPage,
  onBack,
  backLabel = "Bookshelf",
  onNew,
  newLabel = "New",
  newAriaLabel = "New entry",
  children,
  debugBorder = false,
}: OpenBookViewProps) {
  const debug = debugBorder ? { border: "2px solid hotpink" } : {};

  return (
    <>
      <div className="fixed inset-0 z-[45] flex items-center justify-center overflow-hidden bg-leather">
        <div
          className="relative w-[min(100vw,calc(100vh*16/9))]"
          style={{ aspectRatio: "16 / 9" }}
        >
          <Image
            src="/textures/open-book.png"
            alt=""
            fill
            priority
            className="object-contain"
          />

          {/* Back link (top-left, outside the parchment) */}
          <button
            onClick={onBack}
            aria-label="Back to bookshelf"
            className="absolute left-[3%] top-[4%] z-10 flex items-center gap-1.5 rounded-md bg-leather/70 px-3 py-1.5 text-gold shadow-lg shadow-black/60 ring-1 ring-gold/20 backdrop-blur-sm transition hover:bg-leather/85 hover:text-gold"
          >
            <ChevronLeft className="size-4" />
            <span className="font-subheading text-sm font-bold uppercase tracking-[0.18em]">
              {backLabel}
            </span>
          </button>

          {/* New button (top-right, when provided) */}
          {onNew && (
            <button
              onClick={onNew}
              aria-label={newAriaLabel}
              className="absolute right-[3%] top-[4%] z-10 flex items-center gap-1.5 rounded-md bg-leather/70 px-3 py-1.5 text-gold shadow-lg shadow-black/60 ring-1 ring-gold/20 backdrop-blur-sm transition hover:bg-leather/85 hover:text-gold"
            >
              <Plus className="size-4" />
              <span className="font-subheading text-sm font-bold uppercase tracking-[0.18em]">
                {newLabel}
              </span>
            </button>
          )}

          {/* LEFT page */}
          <div
            data-testid="open-book-left"
            className="absolute flex flex-col gap-3 font-medium text-leather"
            style={{ ...LEFT_INSET, ...debug }}
          >
            {leftPage}
          </div>

          {/* RIGHT page */}
          <div
            data-testid="open-book-right"
            className="absolute flex flex-col gap-3 font-medium text-leather"
            style={{ ...RIGHT_INSET, ...debug }}
          >
            {rightPage}
          </div>
        </div>
      </div>

      {children}
    </>
  );
}
