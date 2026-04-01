/**
 * PORTAL-02 — Player KB Filtering
 *
 * Tests that all entity modals filter out gm_only entities when role is "player".
 * Each modal fetches data client-side via supabase. When role is "player", the
 * query must include .eq("gm_only", false) so GM-only entities never reach the client.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { NpcModal } from "./npc-modal";
import { LocationModal } from "./location-modal";
import { FactionModal } from "./faction-modal";
import { ItemModal } from "./item-modal";
import { PlotThreadModal } from "./plot-thread-modal";
import { LoreModal } from "./lore-modal";
import { EventModal } from "./event-modal";
import { ConversationModal } from "./conversation-modal";
import { mockNpc, mockLocation, mockFaction, mockItem, mockPlotThread, mockLoreEntry, mockEvent, mockConversation } from "@/test/mocks";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

// Track all .eq() calls to verify gm_only filtering
const eqCalls: Array<[string, unknown]> = [];

const mockChain: Record<string, ReturnType<typeof vi.fn>> = {
  select: vi.fn(() => mockChain),
  eq: vi.fn((...args: [string, unknown]) => {
    eqCalls.push(args);
    return mockChain;
  }),
  is: vi.fn(() => mockChain),
  order: vi.fn(() => mockChain),
  insert: vi.fn(() => mockChain),
  update: vi.fn(() => mockChain),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  then: vi.fn((resolve: (v: unknown) => void) => resolve({ data: [], error: null })),
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: vi.fn(() => ({ ...mockChain })),
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
  }),
}));

const baseProps = {
  campaignId: "campaign-1",
  userId: "player-user-id",
  open: true,
  onOpenChange: vi.fn(),
};

describe("PORTAL-02 — Player KB Filtering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eqCalls.length = 0;
  });

  // ─── Entity modals filter gm_only for players ─────────

  it("NpcModal filters gm_only=false for players", async () => {
    render(<NpcModal {...baseProps} role="player" />);
    await waitFor(() => {
      expect(eqCalls.some(([key, val]) => key === "gm_only" && val === false)).toBe(true);
    });
  });

  it("NpcModal does NOT filter gm_only for GMs", async () => {
    render(<NpcModal {...baseProps} role="gm" />);
    await waitFor(() => {
      expect(eqCalls.some(([key]) => key === "campaign_id")).toBe(true);
    });
    expect(eqCalls.some(([key]) => key === "gm_only")).toBe(false);
  });

  it("LocationModal filters gm_only=false for players", async () => {
    render(<LocationModal {...baseProps} role="player" />);
    await waitFor(() => {
      expect(eqCalls.some(([key, val]) => key === "gm_only" && val === false)).toBe(true);
    });
  });

  it("LocationModal does NOT filter gm_only for GMs", async () => {
    render(<LocationModal {...baseProps} role="gm" />);
    await waitFor(() => {
      expect(eqCalls.some(([key]) => key === "campaign_id")).toBe(true);
    });
    expect(eqCalls.some(([key]) => key === "gm_only")).toBe(false);
  });

  it("FactionModal filters gm_only=false for players", async () => {
    render(<FactionModal {...baseProps} role="player" />);
    await waitFor(() => {
      expect(eqCalls.some(([key, val]) => key === "gm_only" && val === false)).toBe(true);
    });
  });

  it("ItemModal filters gm_only=false for players", async () => {
    render(<ItemModal {...baseProps} role="player" />);
    await waitFor(() => {
      expect(eqCalls.some(([key, val]) => key === "gm_only" && val === false)).toBe(true);
    });
  });

  it("PlotThreadModal filters gm_only=false for players", async () => {
    render(<PlotThreadModal {...baseProps} role="player" />);
    await waitFor(() => {
      expect(eqCalls.some(([key, val]) => key === "gm_only" && val === false)).toBe(true);
    });
  });

  it("LoreModal filters gm_only=false for players", async () => {
    render(<LoreModal {...baseProps} role="player" />);
    await waitFor(() => {
      expect(eqCalls.some(([key, val]) => key === "gm_only" && val === false)).toBe(true);
    });
  });

  it("EventModal filters gm_only=false for players", async () => {
    render(<EventModal {...baseProps} role="player" />);
    await waitFor(() => {
      expect(eqCalls.some(([key, val]) => key === "gm_only" && val === false)).toBe(true);
    });
  });

  it("ConversationModal filters gm_only=false for players", async () => {
    render(<ConversationModal {...baseProps} role="player" />);
    await waitFor(() => {
      expect(eqCalls.some(([key, val]) => key === "gm_only" && val === false)).toBe(true);
    });
  });

  // ─── Player cannot create entities ─────────────────────

  it("NpcModal hides create button for players", async () => {
    mockChain.order.mockResolvedValueOnce({ data: [mockNpc], error: null });
    render(<NpcModal {...baseProps} role="player" />);
    await waitFor(() => {
      expect(screen.queryByText(/new npc/i)).not.toBeInTheDocument();
    });
  });

  it("LocationModal hides create button for players", async () => {
    mockChain.order.mockResolvedValueOnce({ data: [mockLocation], error: null });
    render(<LocationModal {...baseProps} role="player" />);
    await waitFor(() => {
      expect(screen.queryByText(/new location/i)).not.toBeInTheDocument();
    });
  });
});
