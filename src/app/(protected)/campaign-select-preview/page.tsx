"use client";

import Image from "next/image";
import { useRef, useState } from "react";

// Throwaway preview route — lets the user tune the 9 hotspot positions
// visually against campaign-select.png before any real wiring happens.
// Delete once HOTSPOTS is locked.

type Region = { left: number; top: number; width: number; height: number };

const INITIAL_HOTSPOTS: Region[] = [
  // Cabinet 1 (left): top → bottom
  { left: 15, top: 16, width: 8, height: 18 },
  { left: 15, top: 41, width: 8, height: 18 },
  { left: 15, top: 66, width: 8, height: 18 },
  // Cabinet 2 (middle): top → bottom
  { left: 46, top: 16, width: 8, height: 18 },
  { left: 46, top: 41, width: 8, height: 18 },
  { left: 46, top: 66, width: 8, height: 18 },
  // Cabinet 3 (right): top → bottom
  { left: 76, top: 16, width: 8, height: 18 },
  { left: 76, top: 41, width: 8, height: 18 },
  { left: 76, top: 66, width: 8, height: 18 },
];

export default function CampaignSelectPreviewPage() {
  const imgRef = useRef<HTMLDivElement>(null);
  const [hotspots] = useState<Region[]>(INITIAL_HOTSPOTS);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCursor({ x, y });
  }

  return (
    <div className="fixed inset-0 z-[45] flex items-center justify-center overflow-hidden bg-leather">
      <div
        ref={imgRef}
        onMouseMove={handleMove}
        onMouseLeave={() => setCursor(null)}
        className="relative w-[min(100vw,calc(100vh*16/9))]"
        style={{ aspectRatio: "16 / 9" }}
      >
        <Image
          src="/textures/campaign-select.png"
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 100vw, 1152px"
          className="object-contain"
        />

        {hotspots.map((r, i) => (
          <div
            key={i}
            className="pointer-events-none absolute flex items-center justify-center rounded-sm bg-gold/15 ring-2 ring-gold/80 shadow-[inset_0_0_18px_rgba(200,162,94,0.45)]"
            style={{
              left: `${r.left}%`,
              top: `${r.top}%`,
              width: `${r.width}%`,
              height: `${r.height}%`,
            }}
          >
            <span className="font-heading text-lg font-bold text-gold drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              {i + 1}
            </span>
          </div>
        ))}

        {/* Live mouse readout */}
        <div className="pointer-events-none absolute left-2 top-2 rounded bg-black/70 px-2 py-1 font-mono text-xs text-gold ring-1 ring-gold/30">
          {cursor
            ? `x: ${cursor.x.toFixed(1)}%  y: ${cursor.y.toFixed(1)}%`
            : "hover over the image"}
        </div>

        {/* Coordinate dump */}
        <div className="pointer-events-none absolute right-2 top-2 max-h-[90%] overflow-auto rounded bg-black/70 px-2 py-1 font-mono text-[10px] leading-snug text-gold/90 ring-1 ring-gold/30">
          {hotspots.map((r, i) => (
            <div key={i}>
              {i + 1}: L{r.left} T{r.top} W{r.width} H{r.height}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
