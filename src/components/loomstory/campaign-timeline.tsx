"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollText } from "lucide-react";

const DECORATION_IMAGES: string[] = [
  "/decorations/Dragon.png",
  "/decorations/Mountains.png",
  "/decorations/Ship.png",
  "/decorations/Trees.png",
];

const RAIL_HEIGHT = 300;
const RAIL_CENTER_Y = 150;
const RAIL_PADDING = 48;
const MARKER_WIDTH = 200;
const WAVE_AMPLITUDE = 45;
const WAVE_PERIOD = 880;
const TICK_HEIGHT = 24;
const TICK_DOT_SIZE = 8;
const DECORATION_TOP_PADDING = 12;
const DECORATION_BOTTOM_PADDING = 12;

function lineY(x: number): number {
  return RAIL_CENTER_Y + WAVE_AMPLITUDE * Math.sin((x * 2 * Math.PI) / WAVE_PERIOD);
}

function buildWavePath(railWidth: number): string {
  const startX = RAIL_PADDING;
  const endX = railWidth - RAIL_PADDING;
  if (endX <= startX) return "";
  let path = `M ${startX} ${lineY(startX).toFixed(1)}`;
  for (let x = startX + 6; x <= endX; x += 6) {
    path += ` L ${x} ${lineY(x).toFixed(1)}`;
  }
  return path;
}

interface Decoration {
  src: string;
  x: number;
  y: number;
  size: number;
}

function generateDecorations(spanPx: number): Decoration[] {
  const out: Decoration[] = [];
  let cursor = 80;
  let i = 0;
  while (cursor < spanPx - 100) {
    const src = DECORATION_IMAGES[(i * 5 + 2) % DECORATION_IMAGES.length];
    const requested = 112 + ((i * 3) % 72);
    const lineYHere = lineY(cursor + requested / 2);
    const onTop = lineYHere > RAIL_CENTER_Y;
    const available = onTop
      ? lineYHere - DECORATION_TOP_PADDING - 6
      : RAIL_HEIGHT - lineYHere - DECORATION_BOTTOM_PADDING - 6;
    const size = Math.max(64, Math.min(requested, available));
    const y = onTop ? DECORATION_TOP_PADDING : RAIL_HEIGHT - DECORATION_BOTTOM_PADDING - size;
    out.push({ src, x: cursor, y, size });
    cursor += 700 + (((i * 1009 + 7) % 600) - 300);
    i++;
  }
  return out;
}

export interface TimelineEntity {
  entity_type: string;
  entity_id: string;
  name: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  narrative_day: number | null;
  narrative_time: number | null;
  sequence: number;
  gm_only: boolean;
  entities: TimelineEntity[];
}

interface CampaignTimelineProps {
  events: TimelineEvent[];
}

const UNROLL_DURATION_MS = 1500;
const INK_COLOR = "oklch(0.2 0.04 60)";
const INK_MUTED = "oklch(0.4 0.03 60)";

function formatNarrativeTime(t: number | null): string | null {
  if (t === null) return null;
  const hh = Math.floor(t / 100);
  const mm = t % 100;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function CampaignTimeline({ events }: CampaignTimelineProps) {
  const [unrolling, setUnrolling] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setUnrolling(false), 50);
    return () => clearTimeout(t);
  }, []);

  const visibleEvents = useMemo(() => {
    return events
      .filter((e): e is TimelineEvent & { narrative_day: number } => e.narrative_day !== null)
      .sort((a, b) => {
        if (a.narrative_day !== b.narrative_day) return a.narrative_day - b.narrative_day;
        const ta = a.narrative_time ?? -1;
        const tb = b.narrative_time ?? -1;
        if (ta !== tb) return ta - tb;
        return a.sequence - b.sequence;
      });
  }, [events]);

  const railContentWidth = useMemo(() => {
    return RAIL_PADDING * 2 + visibleEvents.length * MARKER_WIDTH;
  }, [visibleEvents.length]);

  const decorations = useMemo(() => {
    const spanPx = Math.max(1400, railContentWidth);
    return generateDecorations(spanPx);
  }, [railContentWidth]);

  return (
    <div
      data-testid="timeline-container"
      data-unrolling={unrolling ? "true" : "false"}
      className="relative h-[300px] grain rounded-md border border-border/40 shadow-inner overflow-hidden"
      style={{
        clipPath: unrolling ? "inset(0 50% 0 50%)" : "inset(0 0 0 0)",
        transition: `clip-path ${UNROLL_DURATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        color: INK_COLOR,
        backgroundColor: "oklch(0.93 0.04 85)",
        boxShadow: "inset 0 0 70px oklch(0.45 0.10 45 / 0.20)",
      }}
    >
      <div
        data-testid="scroll-end-left"
        aria-hidden
        className="absolute inset-y-0 left-0 z-10"
        style={{
          width: "35px",
          background:
            "linear-gradient(to right, oklch(0.42 0.06 35) 0%, oklch(0.55 0.08 45) 10%, oklch(0.80 0.10 60) 30%, oklch(0.68 0.09 50) 55%, oklch(0.52 0.07 40) 80%, oklch(0.40 0.06 35) 100%)",
          borderRadius: "0 5px 5px 0",
          boxShadow: [
            "inset -2px 0 6px rgba(0,0,0,0.30)",
            "inset 0 5px 7px rgba(0,0,0,0.20)",
            "inset 0 -5px 7px rgba(0,0,0,0.20)",
            "6px 0 12px -4px rgba(0,0,0,0.30)",
          ].join(", "),
        }}
      />
      <div
        data-testid="scroll-end-right"
        aria-hidden
        className="absolute inset-y-0 right-0 z-10"
        style={{
          width: "35px",
          background:
            "linear-gradient(to left, oklch(0.42 0.06 35) 0%, oklch(0.55 0.08 45) 10%, oklch(0.80 0.10 60) 30%, oklch(0.68 0.09 50) 55%, oklch(0.52 0.07 40) 80%, oklch(0.40 0.06 35) 100%)",
          borderRadius: "5px 0 0 5px",
          boxShadow: [
            "inset 2px 0 6px rgba(0,0,0,0.30)",
            "inset 0 5px 7px rgba(0,0,0,0.20)",
            "inset 0 -5px 7px rgba(0,0,0,0.20)",
            "-6px 0 12px -4px rgba(0,0,0,0.30)",
          ].join(", "),
        }}
      />

      <div
        data-testid="timeline-rail"
        className="h-full overflow-x-auto overflow-y-hidden"
      >
        {visibleEvents.length === 0 ? (
          <div className="relative h-full w-max min-w-full">
            <MirrorTileBackground spanPx={5120} />
            <DecorationLayer decorations={decorations} />
            <div className="relative h-full flex flex-col items-center justify-center px-10 z-[1]">
              <ScrollText className="size-10 mx-auto mb-3 opacity-50" style={{ color: INK_MUTED }} />
              <p className="font-lore" style={{ color: INK_MUTED }}>
                Your timeline is blank. Log an event to begin the tale.
              </p>
            </div>
          </div>
        ) : (
          <div
            className="relative h-full"
            style={{ width: `${railContentWidth}px`, paddingLeft: `${RAIL_PADDING}px`, paddingRight: `${RAIL_PADDING}px`, display: "flex", alignItems: "stretch", boxSizing: "border-box" }}
          >
            <MirrorTileBackground spanPx={railContentWidth} />
            <DecorationLayer decorations={decorations} />
            <svg
              aria-hidden
              className="absolute pointer-events-none"
              style={{ left: 0, top: 0, width: `${railContentWidth}px`, height: `${RAIL_HEIGHT}px`, zIndex: 0 }}
              viewBox={`0 0 ${railContentWidth} ${RAIL_HEIGHT}`}
            >
              <path
                d={buildWavePath(railContentWidth)}
                stroke={INK_COLOR}
                strokeWidth="2"
                strokeOpacity="0.7"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            {visibleEvents.map((event, idx) => {
              const labelAbove = idx % 2 === 0;
              const time = formatNarrativeTime(event.narrative_time);
              const markerCenterX = RAIL_PADDING + idx * MARKER_WIDTH + MARKER_WIDTH / 2;
              const lineYHere = lineY(markerCenterX);
              return (
                <div
                  key={event.id}
                  data-testid="timeline-marker"
                  data-event-id={event.id}
                  className="relative h-full flex flex-col items-center flex-shrink-0"
                  style={{ width: `${MARKER_WIDTH}px`, zIndex: 1 }}
                >
                  <div
                    className="flex flex-col items-center justify-end w-full pb-3"
                    style={{ height: `${lineYHere}px` }}
                  >
                    {labelAbove && <MarkerContent event={event} time={time} />}
                  </div>

                  <div
                    aria-hidden
                    className="absolute left-1/2 -translate-x-1/2"
                    style={{
                      top: `${lineYHere - TICK_HEIGHT / 2}px`,
                      width: "2px",
                      height: `${TICK_HEIGHT}px`,
                      background: INK_COLOR,
                      opacity: 0.85,
                    }}
                  />
                  <div
                    aria-hidden
                    className="absolute left-1/2 -translate-x-1/2 rounded-full"
                    style={{
                      top: `${lineYHere - TICK_DOT_SIZE / 2}px`,
                      width: `${TICK_DOT_SIZE}px`,
                      height: `${TICK_DOT_SIZE}px`,
                      background: INK_COLOR,
                    }}
                  />

                  <div
                    className="flex flex-col items-center justify-start w-full pt-3"
                    style={{ height: `${RAIL_HEIGHT - lineYHere}px` }}
                  >
                    {!labelAbove && <MarkerContent event={event} time={time} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const PARCHMENT_TILE_WIDTH = 2560;

function MirrorTileBackground({ spanPx }: { spanPx: number }) {
  const tileCount = Math.max(1, Math.ceil(spanPx / PARCHMENT_TILE_WIDTH) + 1);
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {Array.from({ length: tileCount }, (_, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src="/decorations/ParchmentTexture.png"
          alt=""
          width={PARCHMENT_TILE_WIDTH}
          height={RAIL_HEIGHT}
          style={{
            position: "absolute",
            left: `${i * PARCHMENT_TILE_WIDTH}px`,
            top: 0,
            transform: i % 2 === 1 ? "scaleX(-1)" : undefined,
            transformOrigin: "center",
          }}
        />
      ))}
    </div>
  );
}

function DecorationLayer({ decorations }: { decorations: Decoration[] }) {
  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none overflow-hidden z-0"
      style={{ mixBlendMode: "multiply" }}
    >
      {decorations.map((d, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={d.src}
          alt=""
          width={d.size}
          height={d.size}
          loading="lazy"
          style={{
            position: "absolute",
            left: `${d.x}px`,
            top: `${d.y}px`,
            opacity: 0.85,
          }}
        />
      ))}
    </div>
  );
}

function MarkerContent({
  event,
  time,
}: {
  event: TimelineEvent & { narrative_day: number };
  time: string | null;
}) {
  return (
    <>
      <div
        data-testid="timeline-day-stamp"
        className="font-mono text-xs whitespace-nowrap mb-1"
        style={{ color: INK_MUTED }}
      >
        <span>Day {event.narrative_day}</span>
        {time && <span className="ml-1.5">{time}</span>}
      </div>
      <p
        className="font-lore text-sm text-center line-clamp-2 leading-snug px-1"
        style={{ color: INK_COLOR }}
      >
        {event.title}
      </p>
      {event.entities.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-center mt-1.5 px-1">
          {event.entities.map((ent) => (
            <Badge
              key={`${ent.entity_type}:${ent.entity_id}`}
              variant="outline"
              className="text-[10px] px-1.5 py-0 border-[oklch(0.4_0.04_60)/0.5]"
              style={{ color: INK_COLOR }}
            >
              {ent.name}
            </Badge>
          ))}
        </div>
      )}
    </>
  );
}
