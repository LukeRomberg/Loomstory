"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import { ScrollText } from "lucide-react";

const RAIL_HEIGHT = 300;
const BANNER_HEIGHT = 44;
const RAIL_PADDING = 48;
const MARKER_WIDTH = 200;
const TICK_HEIGHT = 24;
const TICK_DOT_SIZE = 8;
const ICON_SIZE = 36;
const PARCHMENT_TILE_WIDTH = 2560;

const ICON_FOR_EVENT_TYPE: Record<string, string> = {
  general: "game-icons:scroll-unfurled",
  scene: "game-icons:campfire",
  decision: "game-icons:crossroad",
  discovery: "game-icons:compass",
  conversation: "game-icons:talk",
  promise: "game-icons:knot",
  todo: "game-icons:checklist",
  upcoming: "game-icons:hourglass",
  milestone: "game-icons:trophy",
  mood: "game-icons:two-shadows",
  quote: "game-icons:quill-ink",
};

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
  event_type?: string;
  entities: TimelineEntity[];
}

interface CampaignTimelineProps {
  events: TimelineEvent[];
  campaignName: string;
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

export function CampaignTimeline({ events, campaignName }: CampaignTimelineProps) {
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

  const lineCenterY = (RAIL_HEIGHT + BANNER_HEIGHT) / 2;

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
      <TitleBanner campaignName={campaignName} />

      <div
        data-testid="timeline-rail"
        className="h-full overflow-x-auto overflow-y-hidden"
      >
        {visibleEvents.length === 0 ? (
          <div className="relative h-full w-max min-w-full">
            <MirrorTileBackground spanPx={5120} />
            <div
              className="relative h-full flex flex-col items-center justify-center px-10 z-[1]"
              style={{ paddingTop: BANNER_HEIGHT }}
            >
              <ScrollText className="size-10 mx-auto mb-3 opacity-50" style={{ color: INK_MUTED }} />
              <p className="font-lore" style={{ color: INK_MUTED }}>
                Your timeline is blank. Log an event to begin the tale.
              </p>
            </div>
          </div>
        ) : (
          <div
            className="relative h-full"
            style={{
              width: `${railContentWidth}px`,
              paddingLeft: `${RAIL_PADDING}px`,
              paddingRight: `${RAIL_PADDING}px`,
              paddingTop: `${BANNER_HEIGHT}px`,
              display: "flex",
              alignItems: "stretch",
              boxSizing: "border-box",
            }}
          >
            <MirrorTileBackground spanPx={railContentWidth} />
            <div
              aria-hidden
              className="absolute"
              style={{
                left: RAIL_PADDING,
                right: RAIL_PADDING,
                top: lineCenterY,
                height: "2px",
                background: INK_COLOR,
                opacity: 0.7,
                transform: "translateY(-50%)",
              }}
            />
            {visibleEvents.map((event, idx) => {
              const labelAbove = idx % 2 === 0;
              const time = formatNarrativeTime(event.narrative_time);
              const eventType = event.event_type ?? "general";
              const iconName = ICON_FOR_EVENT_TYPE[eventType] ?? ICON_FOR_EVENT_TYPE.general;
              return (
                <div
                  key={event.id}
                  data-testid="timeline-marker"
                  data-event-id={event.id}
                  className="relative flex flex-col items-center flex-shrink-0"
                  style={{ width: `${MARKER_WIDTH}px`, height: `${RAIL_HEIGHT - BANNER_HEIGHT}px`, zIndex: 1 }}
                >
                  <div
                    className="w-full"
                    style={{ height: `${(RAIL_HEIGHT - BANNER_HEIGHT) / 2}px` }}
                  >
                    {labelAbove && (
                      <div className="h-full flex flex-col items-center justify-between pb-3 pt-2">
                        <Icon
                          icon={iconName}
                          width={ICON_SIZE}
                          height={ICON_SIZE}
                          style={{ color: INK_COLOR, opacity: 0.85 }}
                        />
                        <MarkerContent event={event} time={time} />
                      </div>
                    )}
                  </div>

                  <div
                    aria-hidden
                    className="absolute left-1/2 -translate-x-1/2"
                    style={{
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                      width: "2px",
                      height: `${TICK_HEIGHT}px`,
                      background: INK_COLOR,
                      opacity: 0.85,
                    }}
                  />
                  <div
                    aria-hidden
                    className="absolute left-1/2 rounded-full"
                    style={{
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                      width: `${TICK_DOT_SIZE}px`,
                      height: `${TICK_DOT_SIZE}px`,
                      background: INK_COLOR,
                    }}
                  />

                  <div
                    className="w-full"
                    style={{ height: `${(RAIL_HEIGHT - BANNER_HEIGHT) / 2}px` }}
                  >
                    {!labelAbove && (
                      <div className="h-full flex flex-col items-center justify-between pt-3 pb-2">
                        <MarkerContent event={event} time={time} />
                        <Icon
                          icon={iconName}
                          width={ICON_SIZE}
                          height={ICON_SIZE}
                          style={{ color: INK_COLOR, opacity: 0.85 }}
                        />
                      </div>
                    )}
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

function TitleBanner({ campaignName }: { campaignName: string }) {
  return (
    <div
      aria-hidden={false}
      className="absolute left-0 right-0 top-0 z-[5] flex items-center justify-center pointer-events-none"
      style={{ height: `${BANNER_HEIGHT}px` }}
    >
      <div
        className="px-6 py-1 font-heading text-base text-center"
        style={{
          color: INK_COLOR,
          letterSpacing: "0.04em",
          textShadow: "0 1px 0 oklch(0.95 0.04 85)",
          maxWidth: "70%",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        A Chronicle of {campaignName}
      </div>
    </div>
  );
}

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

function MarkerContent({
  event,
  time,
}: {
  event: TimelineEvent & { narrative_day: number };
  time: string | null;
}) {
  return (
    <div className="flex flex-col items-center w-full">
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
    </div>
  );
}
