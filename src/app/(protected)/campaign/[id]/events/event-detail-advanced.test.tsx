import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventDetail } from "./event-detail";
import { mockEvent } from "@/test/mocks";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

// Event with entity tags and parent
const eventWithTags = {
  ...mockEvent,
  entity_tags: [
    { entity_type: "npc", entity_id: "npc-1", entity_name: "Gareth the Bold", role: "subject" },
    { entity_type: "location", entity_id: "location-1", entity_name: "Ironhold", role: "location" },
  ],
  parent_id: null,
  children_count: 2,
};

const childEvent = {
  ...mockEvent,
  id: "event-child-1",
  parent_id: "event-1",
  summary: "A child scene within the arrival",
  children_count: 0,
};

const defaultProps = {
  campaignId: "campaign-1",
  campaignName: "Test Campaign",
  event: mockEvent,
  role: "gm",
};

describe("EventDetail — Entity Tags (EVT-09)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        knownEntities: [
          { id: "npc-1", name: "Gareth the Bold", entity_type: "npc" },
          { id: "location-1", name: "Ironhold", entity_type: "location" },
        ],
      }),
    });
  });

  it("shows entity tags section on detail page", () => {
    render(<EventDetail {...defaultProps} event={eventWithTags} />);
    expect(screen.getByText(/tagged entities/i) || screen.getByText(/Gareth the Bold/)).toBeTruthy();
  });

  it("renders tagged entity names", () => {
    render(<EventDetail {...defaultProps} event={eventWithTags} />);
    expect(screen.getByText("Gareth the Bold")).toBeInTheDocument();
    expect(screen.getByText("Ironhold")).toBeInTheDocument();
  });

  it("renders entity type badges on tags", () => {
    render(<EventDetail {...defaultProps} event={eventWithTags} />);
    expect(screen.getAllByText("npc").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("location").length).toBeGreaterThanOrEqual(1);
  });

  it("renders role labels on tags", () => {
    render(<EventDetail {...defaultProps} event={eventWithTags} />);
    expect(screen.getByText("subject")).toBeInTheDocument();
    // "location" appears as both entity_type badge and role badge
    expect(screen.getAllByText("location").length).toBeGreaterThanOrEqual(2);
  });

  it("clicking a tagged entity navigates to its detail page", async () => {
    const user = userEvent.setup();
    render(<EventDetail {...defaultProps} event={eventWithTags} />);
    await user.click(screen.getByText("Gareth the Bold"));
    expect(mockPush).toHaveBeenCalledWith("/campaign/campaign-1/npcs/npc-1");
  });

  it("shows 'no entities tagged' when tags are empty", () => {
    render(<EventDetail {...defaultProps} />);
    // mockEvent has no entity_tags
    expect(screen.getByText(/no entities tagged/i) || screen.queryByText("Gareth the Bold") === null).toBeTruthy();
  });
});

describe("EventDetail — Hierarchy (EVT-07)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows parent link when event has a parent", () => {
    render(<EventDetail {...defaultProps} event={childEvent} />);
    expect(screen.getByText(/parent event/i)).toBeInTheDocument();
  });

  it("does not show parent link for top-level events", () => {
    render(<EventDetail {...defaultProps} />);
    expect(screen.queryByText(/parent event/i)).not.toBeInTheDocument();
  });

  it("shows children count when event has children", () => {
    render(<EventDetail {...defaultProps} event={eventWithTags} />);
    expect(screen.getByText(/2 sub-events/i)).toBeInTheDocument();
  });

  it("does not show children section when count is 0", () => {
    render(<EventDetail {...defaultProps} />);
    expect(screen.queryByText(/sub-events/i)).not.toBeInTheDocument();
  });

  it("shows 'Add Sub-Event' button for GMs on parent events", () => {
    render(<EventDetail {...defaultProps} event={eventWithTags} />);
    expect(screen.getByText(/add sub-event/i)).toBeInTheDocument();
  });
});
