import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EntityDetailTabs } from "./entity-detail-tabs";
import { mockRelations, mockRelationTypes, mockEntityHistory } from "@/test/mocks";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

// Mock the fetch for lazy-loaded tabs
const mockFetch = vi.fn();
global.fetch = mockFetch;

const defaultProps = {
  campaignId: "campaign-1",
  entityType: "npc" as const,
  entityId: "npc-1",
  entityName: "Gareth the Bold",
  role: "gm",
  userId: "user-1",
  overviewContent: <div>Overview content here</div>,
};

describe("EntityDetailTabs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        relations: mockRelations.slice(0, 2),
        relationTypes: mockRelationTypes,
        knownEntities: [
          { id: "npc-1", name: "Gareth the Bold", entity_type: "npc" },
          { id: "location-1", name: "Ironhold", entity_type: "location" },
          { id: "faction-1", name: "The Crimson Hand", entity_type: "faction" },
        ],
      }),
    });
  });

  // ─── Tab Rendering ────────────────────────────────────────

  it("renders Overview tab as active by default", () => {
    render(<EntityDetailTabs {...defaultProps} />);
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Overview content here")).toBeInTheDocument();
  });

  it("renders Relationships tab", () => {
    render(<EntityDetailTabs {...defaultProps} />);
    expect(screen.getByText("Relationships")).toBeInTheDocument();
  });

  it("renders History tab", () => {
    render(<EntityDetailTabs {...defaultProps} />);
    expect(screen.getByText("History")).toBeInTheDocument();
  });

  it("shows Overview content by default, not Relations or History", () => {
    render(<EntityDetailTabs {...defaultProps} />);
    expect(screen.getByText("Overview content here")).toBeInTheDocument();
  });

  // ─── Tab Switching ────────────────────────────────────────

  it("switches to Relationships tab on click", async () => {
    const user = userEvent.setup();
    render(<EntityDetailTabs {...defaultProps} />);
    await user.click(screen.getByText("Relationships"));
    // Overview content should be hidden
    expect(screen.queryByText("Overview content here")).not.toBeInTheDocument();
  });

  it("switches to History tab on click", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockEntityHistory),
    });
    const user = userEvent.setup();
    render(<EntityDetailTabs {...defaultProps} />);
    await user.click(screen.getByText("History"));
    expect(screen.queryByText("Overview content here")).not.toBeInTheDocument();
  });

  it("switches back to Overview tab", async () => {
    const user = userEvent.setup();
    render(<EntityDetailTabs {...defaultProps} />);
    await user.click(screen.getByText("Relationships"));
    await user.click(screen.getByText("Overview"));
    expect(screen.getByText("Overview content here")).toBeInTheDocument();
  });

  // ─── Lazy Loading ─────────────────────────────────────────

  it("fetches relations data when Relationships tab is clicked", async () => {
    const user = userEvent.setup();
    render(<EntityDetailTabs {...defaultProps} />);
    await user.click(screen.getByText("Relationships"));
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  it("fetches history data when History tab is clicked", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockEntityHistory),
    });
    const user = userEvent.setup();
    render(<EntityDetailTabs {...defaultProps} />);
    await user.click(screen.getByText("History"));
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  it("shows loading state while fetching tab data", async () => {
    // Make fetch hang
    mockFetch.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    render(<EntityDetailTabs {...defaultProps} />);
    await user.click(screen.getByText("Relationships"));
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
