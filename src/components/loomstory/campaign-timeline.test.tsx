import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { CampaignTimeline, type TimelineEvent } from "./campaign-timeline";

const baseEvent = (overrides: Partial<TimelineEvent> = {}): TimelineEvent => ({
  id: "evt-1",
  title: "An untitled moment",
  narrative_day: 1,
  narrative_time: null,
  sequence: 0,
  gm_only: false,
  entities: [],
  ...overrides,
});

describe("CampaignTimeline", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a blank-scroll empty state when there are no events", () => {
    render(<CampaignTimeline events={[]} />);
    expect(
      screen.getByText(/your timeline is blank/i)
    ).toBeInTheDocument();
  });

  it("renders one marker per event in narrative_day → narrative_time → sequence order", () => {
    const events: TimelineEvent[] = [
      baseEvent({ id: "c", title: "Third moment", narrative_day: 5, narrative_time: 800, sequence: 0 }),
      baseEvent({ id: "a", title: "First moment", narrative_day: 1, narrative_time: 900, sequence: 0 }),
      baseEvent({ id: "b", title: "Second moment", narrative_day: 1, narrative_time: 900, sequence: 1 }),
      baseEvent({ id: "d", title: "Fourth moment", narrative_day: 5, narrative_time: 1430, sequence: 0 }),
    ];

    render(<CampaignTimeline events={events} />);

    const markers = screen.getAllByTestId("timeline-marker");
    expect(markers).toHaveLength(4);
    expect(markers.map((m) => m.getAttribute("data-event-id"))).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  it("renders day stamp, title, and entity chips for each marker", () => {
    const events: TimelineEvent[] = [
      baseEvent({
        id: "evt-1",
        title: "Met Gareth at the Sunken Tavern",
        narrative_day: 5,
        narrative_time: 1430,
        entities: [
          { entity_type: "npc", entity_id: "npc-1", name: "Gareth" },
          { entity_type: "location", entity_id: "loc-1", name: "Sunken Tavern" },
        ],
      }),
    ];

    render(<CampaignTimeline events={events} />);

    expect(screen.getByText(/Day 5/i)).toBeInTheDocument();
    expect(screen.getByText("14:30")).toBeInTheDocument();
    expect(screen.getByText("Met Gareth at the Sunken Tavern")).toBeInTheDocument();
    expect(screen.getByText("Gareth")).toBeInTheDocument();
    expect(screen.getByText("Sunken Tavern")).toBeInTheDocument();
  });

  it("excludes events with a null narrative_day", () => {
    const events: TimelineEvent[] = [
      baseEvent({ id: "kept", title: "On the timeline", narrative_day: 2 }),
      baseEvent({ id: "dropped", title: "Forgotten in time", narrative_day: null }),
    ];

    render(<CampaignTimeline events={events} />);

    expect(screen.getByText("On the timeline")).toBeInTheDocument();
    expect(screen.queryByText("Forgotten in time")).not.toBeInTheDocument();
  });

  it("starts with data-unrolling='true' on mount and transitions to 'false' after the animation", () => {
    const events: TimelineEvent[] = [baseEvent()];
    render(<CampaignTimeline events={events} />);

    const container = screen.getByTestId("timeline-container");
    expect(container.getAttribute("data-unrolling")).toBe("true");

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(container.getAttribute("data-unrolling")).toBe("false");
  });

  it("renders the rail with horizontal overflow scrolling", () => {
    render(<CampaignTimeline events={[baseEvent()]} />);
    const rail = screen.getByTestId("timeline-rail");
    expect(rail.className).toMatch(/overflow-x-auto/);
  });

  it("applies the parchment, font-lore, and font-mono styling conventions", () => {
    const events: TimelineEvent[] = [
      baseEvent({ id: "evt-1", title: "Aged ink", narrative_day: 3, narrative_time: 900 }),
    ];
    render(<CampaignTimeline events={events} />);

    const container = screen.getByTestId("timeline-container");
    expect(container.className).toMatch(/grain/);

    const stamp = screen.getByTestId("timeline-day-stamp");
    expect(stamp.className).toMatch(/font-mono/);

    const title = screen.getByText("Aged ink");
    expect(title.className).toMatch(/font-lore/);
  });
});
