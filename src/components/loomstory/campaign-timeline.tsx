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
  const TOP_PADDING = 12;
  const BOTTOM_PADDING = 12;
  const CONTAINER_HEIGHT = 300;
  while (cursor < spanPx - 100) {
    const src = DECORATION_IMAGES[(i * 5 + 2) % DECORATION_IMAGES.length];
    const size = 112 + ((i * 3) % 72);
    const onTop = ((i * 1481 + 3) % 100) < 50;
    const y = onTop ? TOP_PADDING : CONTAINER_HEIGHT - BOTTOM_PADDING - size;
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

  const decorations = useMemo(() => {
    const spanPx = Math.max(1400, visibleEvents.length * 220 + 240);
    return generateDecorations(spanPx);
  }, [visibleEvents.length]);

  return (
    <div
      data-testid="timeline-container"
      data-unrolling={unrolling ? "true" : "false"}
      className="relative h-[300px] grain rounded-md border border-border/40 bg-[oklch(0.93_0.04_85)] shadow-inner overflow-hidden"
      style={{
        clipPath: unrolling ? "inset(0 50% 0 50%)" : "inset(0 0 0 0)",
        transition: `clip-path ${UNROLL_DURATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        color: INK_COLOR,
      }}
    >
      <div
        data-testid="scroll-end-left"
        aria-hidden
        className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[oklch(0.55_0.08_60)] to-transparent shadow-[inset_-4px_0_8px_rgba(0,0,0,0.3)] z-10"
      />
      <div
        data-testid="scroll-end-right"
        aria-hidden
        className="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[oklch(0.55_0.08_60)] to-transparent shadow-[inset_4px_0_8px_rgba(0,0,0,0.3)] z-10"
      />

      <div
        data-testid="timeline-rail"
        className="h-full overflow-x-auto overflow-y-hidden"
      >
        {visibleEvents.length === 0 ? (
          <div className="relative h-full w-max min-w-full">
            <DecorationLayer decorations={decorations} />
            <div className="relative h-full flex flex-col items-center justify-center px-10 z-[1]">
              <ScrollText className="size-10 mx-auto mb-3 opacity-50" style={{ color: INK_MUTED }} />
              <p className="font-lore" style={{ color: INK_MUTED }}>
                Your timeline is blank. Log an event to begin the tale.
              </p>
            </div>
          </div>
        ) : (
          <div className="relative h-full w-max min-w-full px-12 flex items-stretch">
            <DecorationLayer decorations={decorations} />
            <div
              aria-hidden
              className="absolute left-12 right-12 top-1/2 -translate-y-1/2"
              style={{
                height: "2px",
                background: INK_COLOR,
                opacity: 0.65,
              }}
            />
            {visibleEvents.map((event, idx) => {
              const above = idx % 2 === 0;
              const time = formatNarrativeTime(event.narrative_time);
              return (
                <div
                  key={event.id}
                  data-testid="timeline-marker"
                  data-event-id={event.id}
                  className="relative h-full flex flex-col items-center min-w-[180px] max-w-[220px] z-[1]"
                >
                  <div
                    className="flex flex-col items-center justify-end w-full pb-4"
                    style={{ height: "50%" }}
                  >
                    {above && <MarkerContent event={event} time={time} />}
                  </div>

                  <div
                    aria-hidden
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{
                      width: "2px",
                      height: "20px",
                      background: INK_COLOR,
                      opacity: 0.85,
                    }}
                  />
                  <div
                    aria-hidden
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-2 rounded-full"
                    style={{ background: INK_COLOR }}
                  />

                  <div
                    className="flex flex-col items-center justify-start w-full pt-4"
                    style={{ height: "50%" }}
                  >
                    {!above && <MarkerContent event={event} time={time} />}
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
