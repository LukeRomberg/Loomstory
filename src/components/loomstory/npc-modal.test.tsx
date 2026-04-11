"use client";

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NpcModal } from "./npc-modal";

// ─── Mocks ───────────────────────────────────────────────
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockRpc = vi.fn();

function chainable(finalValue: unknown) {
  const chain: Record<string, unknown> = {};
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_t, prop) {
      if (prop === "then") return undefined;
      if (typeof prop === "string" && typeof finalValue === "object" && finalValue !== null && prop in finalValue) {
        return (finalValue as Record<string, unknown>)[prop];
      }
      return (..._args: unknown[]) => new Proxy(chain, handler);
    },
  };
  return new Proxy(chain, handler);
}

// Deep-dive entity mock data
const deepDiveEntities: Record<string, Record<string, unknown>> = {
  "faction-1": {
    id: "faction-1",
    name: "Silver Order",
    description: "A holy order of knights",
    gm_notes: "Secret faction notes",
    player_notes: null,
    gm_only: false,
    goals: "Protect the realm",
    deleted_at: null,
  },
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table === "npcs") {
        return {
          select: (...args: unknown[]) => mockSelect(table, ...args),
          insert: (...args: unknown[]) => mockInsert(table, ...args),
          update: (...args: unknown[]) => mockUpdate(table, ...args),
        };
      }
      // Deep-dive entity fetch: from(table).select("*").eq("id", id).single()
      return {
        select: () => ({
          eq: (_col: string, id: string) => ({
            single: () => Promise.resolve({ data: deepDiveEntities[id] ?? null, error: null }),
          }),
          ...chainable({ data: [], error: null }),
        }),
        insert: () => chainable({ data: null, error: null }),
        update: () => chainable({ data: null, error: null }),
      };
    },
    auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } } }) },
    rpc: mockRpc,
  }),
}));

// Mock fetch for API routes (relations + history)
const mockFetchResponse = vi.fn();
vi.stubGlobal("fetch", mockFetchResponse);

// ─── Test data ───────────────────────────────────────────
const baseNpc = {
  id: "npc-1",
  name: "Gareth the Bold",
  aliases: ["The Bold"],
  description: "A brave knight",
  appearance: "Tall with a scar",
  voice_notes: "Deep voice",
  personality: "Courageous",
  status: "alive",
  tags: ["ally", "knight"],
  portrait_url: null,
  gm_notes: "Secret past",
  player_notes: "Met in town",
  gm_only: false,
};

function setupNpcQuery(npcs = [baseNpc]) {
  mockSelect.mockReturnValue(
    chainable({ data: npcs, error: null })
  );
}

function setupFetchMock() {
  mockFetchResponse.mockImplementation((url: string) => {
    if (url.includes("/relations")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            relations: [
              {
                id: "rel-1",
                source_type: "npc",
                source_id: "npc-1",
                target_type: "faction",
                target_id: "faction-1",
                relation_type: "member_of",
                description: "Founding member",
                source_name: "Gareth the Bold",
                target_name: "Silver Order",
              },
            ],
            relationTypes: [
              { id: "member_of", label: "Member Of" },
              { id: "allied_with", label: "Allied With" },
            ],
            knownEntities: [
              { id: "faction-1", name: "Silver Order", entity_type: "faction" },
            ],
          }),
      });
    }
    if (url.includes("/history")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            events: [
              {
                id: "evt-1",
                content: "Gareth defeated the troll",
                summary: "Troll fight",
                weight: 5,
                event_type: "combat",
                narrative_day: 1,
                narrative_time: null,
                resolved: false,
                created_at: "2026-01-15T10:00:00Z",
                role: "subject",
              },
            ],
            conversations: [
              {
                id: "conv-1",
                title: "Gareth negotiation",
                participants: [{ entity_id: "npc-1", name: "Gareth", entity_type: "npc" }],
                turn_count: 5,
                created_at: "2026-01-16T10:00:00Z",
              },
            ],
            session_mentions: [
              {
                session_id: "sess-1",
                session_title: "The Dragon's Lair",
                session_number: 3,
                mention_type: "introduced",
                created_at: "2026-01-10T10:00:00Z",
              },
            ],
          }),
      });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
}

// ─── Tests ───────────────────────────────────────────────
describe("NpcModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupNpcQuery();
    setupFetchMock();
  });

  function renderModal(props: Partial<Parameters<typeof NpcModal>[0]> = {}) {
    return render(
      <NpcModal
        campaignId="camp-1"
        userId="user-1"
        role="gm"
        open={true}
        onOpenChange={vi.fn()}
        {...props}
      />
    );
  }

  it("renders NPC list when open", async () => {
    renderModal();
    await waitFor(() => {
      expect(screen.getByText("Gareth the Bold")).toBeInTheDocument();
    });
  });

  describe("NPC Detail - Subheader", () => {
    it("shows tags in the subheader row next to status", async () => {
      const user = userEvent.setup();
      renderModal();
      await waitFor(() => expect(screen.getByText("Gareth the Bold")).toBeInTheDocument());
      await user.click(screen.getByText("Gareth the Bold"));

      // Tags should be visible (may appear in both list item and detail header)
      await waitFor(() => {
        expect(screen.getAllByText("ally").length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText("knight").length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText("alive").length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe("NPC Detail - Tabs", () => {
    async function selectNpc() {
      const user = userEvent.setup();
      renderModal();
      await waitFor(() => expect(screen.getByText("Gareth the Bold")).toBeInTheDocument());
      await user.click(screen.getByText("Gareth the Bold"));
      return user;
    }

    it("shows General tab by default with description and notes", async () => {
      await selectNpc();
      await waitFor(() => {
        expect(screen.getByRole("tab", { name: /general/i })).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: /relationships/i })).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: /history/i })).toBeInTheDocument();
      });
      // General tab content should be visible (description may also appear in list)
      expect(screen.getAllByText("A brave knight").length).toBeGreaterThanOrEqual(1);
    });

    it("does not fetch relations or history until tab is clicked", async () => {
      await selectNpc();
      await waitFor(() => expect(screen.getByRole("tab", { name: /general/i })).toBeInTheDocument());
      // No fetch calls should have been made for relations or history
      const fetchCalls = mockFetchResponse.mock.calls.map(([url]) => url as string);
      expect(fetchCalls.some((u: string) => u.includes("/relations"))).toBe(false);
      expect(fetchCalls.some((u: string) => u.includes("/history"))).toBe(false);
    });

    it("fetches relations only when Relationships tab is clicked", async () => {
      const user = await selectNpc();
      await waitFor(() => expect(screen.getByRole("tab", { name: /relationships/i })).toBeInTheDocument());
      await user.click(screen.getByRole("tab", { name: /relationships/i }));
      await waitFor(() => {
        const fetchCalls = mockFetchResponse.mock.calls.map(([url]) => url as string);
        expect(fetchCalls.some((u: string) => u.includes("/relations"))).toBe(true);
      });
      // History should NOT have been fetched
      const fetchCalls = mockFetchResponse.mock.calls.map(([url]) => url as string);
      expect(fetchCalls.some((u: string) => u.includes("/history"))).toBe(false);
    });

    it("fetches history only when History tab is clicked", async () => {
      const user = await selectNpc();
      await waitFor(() => expect(screen.getByRole("tab", { name: /history/i })).toBeInTheDocument());
      await user.click(screen.getByRole("tab", { name: /history/i }));
      await waitFor(() => {
        const fetchCalls = mockFetchResponse.mock.calls.map(([url]) => url as string);
        expect(fetchCalls.some((u: string) => u.includes("/history"))).toBe(true);
      });
      // Relations should NOT have been fetched
      const fetchCalls = mockFetchResponse.mock.calls.map(([url]) => url as string);
      expect(fetchCalls.some((u: string) => u.includes("/relations"))).toBe(false);
    });

    it("switches to Relationships tab and shows relations", async () => {
      const user = await selectNpc();
      await waitFor(() => expect(screen.getByRole("tab", { name: /relationships/i })).toBeInTheDocument());
      await user.click(screen.getByRole("tab", { name: /relationships/i }));
      await waitFor(() => {
        expect(screen.getByText("Silver Order")).toBeInTheDocument();
      });
    });

    it("switches to History tab and shows events", async () => {
      const user = await selectNpc();
      await waitFor(() => expect(screen.getByRole("tab", { name: /history/i })).toBeInTheDocument());
      await user.click(screen.getByRole("tab", { name: /history/i }));
      await waitFor(() => {
        expect(screen.getByText(/Troll fight|Gareth defeated the troll/)).toBeInTheDocument();
      });
    });

    it("shows session mentions in history tab", async () => {
      const user = await selectNpc();
      await waitFor(() => expect(screen.getByRole("tab", { name: /history/i })).toBeInTheDocument());
      await user.click(screen.getByRole("tab", { name: /history/i }));
      await waitFor(() => {
        expect(screen.getByText(/The Dragon's Lair/)).toBeInTheDocument();
      });
    });

    it("shows conversations in history tab", async () => {
      const user = await selectNpc();
      await waitFor(() => expect(screen.getByRole("tab", { name: /history/i })).toBeInTheDocument());
      await user.click(screen.getByRole("tab", { name: /history/i }));
      await waitFor(() => {
        expect(screen.getByText(/Gareth negotiation/)).toBeInTheDocument();
      });
    });

    it("shows empty state when no relations exist", async () => {
      mockFetchResponse.mockImplementation((url: string) => {
        if (url.includes("/relations")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ relations: [], relationTypes: [], knownEntities: [] }),
          });
        }
        if (url.includes("/history")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ events: [], conversations: [], session_mentions: [] }),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      const user = await selectNpc();
      await waitFor(() => expect(screen.getByRole("tab", { name: /relationships/i })).toBeInTheDocument());
      await user.click(screen.getByRole("tab", { name: /relationships/i }));
      await waitFor(() => {
        expect(screen.getByText(/no relationships/i)).toBeInTheDocument();
      });
    });

    it("shows empty state when no history exists", async () => {
      mockFetchResponse.mockImplementation((url: string) => {
        if (url.includes("/relations")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ relations: [], relationTypes: [], knownEntities: [] }),
          });
        }
        if (url.includes("/history")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ events: [], conversations: [], session_mentions: [] }),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      const user = await selectNpc();
      await waitFor(() => expect(screen.getByRole("tab", { name: /history/i })).toBeInTheDocument());
      await user.click(screen.getByRole("tab", { name: /history/i }));
      await waitFor(() => {
        expect(screen.getByText(/no history/i)).toBeInTheDocument();
      });
    });
  });

  describe("NPC Detail - Deep Dive Navigation", () => {
    async function navigateToRelation() {
      const user = userEvent.setup();
      renderModal();
      await waitFor(() => expect(screen.getByText("Gareth the Bold")).toBeInTheDocument());
      await user.click(screen.getByText("Gareth the Bold"));
      await waitFor(() => expect(screen.getByRole("tab", { name: /relationships/i })).toBeInTheDocument());
      await user.click(screen.getByRole("tab", { name: /relationships/i }));
      await waitFor(() => expect(screen.getByText("Silver Order")).toBeInTheDocument());
      // Click the related entity name to deep-dive
      await user.click(screen.getByText("Silver Order"));
      return user;
    }

    it("shows breadcrumb trail when navigating to a related entity", async () => {
      await navigateToRelation();
      await waitFor(() => {
        const trail = screen.getByTestId("breadcrumb-trail");
        expect(trail).toBeInTheDocument();
        // Original NPC should be in the breadcrumb
        expect(within(trail).getByText("Gareth the Bold")).toBeInTheDocument();
        // Current entity name should be shown
        expect(within(trail).getByText("Silver Order")).toBeInTheDocument();
      });
    });

    it("shows the deep-dive entity detail with type badge", async () => {
      await navigateToRelation();
      await waitFor(() => {
        expect(screen.getByText("Faction")).toBeInTheDocument();
        expect(screen.getByText("A holy order of knights")).toBeInTheDocument();
      });
    });

    it("applies slide-in-right animation when navigating forward", async () => {
      await navigateToRelation();
      await waitFor(() => {
        const animated = document.querySelector(".animate-slide-in-right");
        expect(animated).toBeInTheDocument();
      });
    });

    it("navigates back when clicking breadcrumb", async () => {
      const user = await navigateToRelation();
      await waitFor(() => expect(screen.getByTestId("breadcrumb-trail")).toBeInTheDocument());
      // Click "Gareth the Bold" in the breadcrumb to go back
      await user.click(within(screen.getByTestId("breadcrumb-trail")).getByText("Gareth the Bold"));
      await waitFor(() => {
        // Breadcrumb should disappear (back to root)
        expect(screen.queryByTestId("breadcrumb-trail")).not.toBeInTheDocument();
        // Original NPC detail should be visible
        expect(screen.getAllByText("Gareth the Bold").length).toBeGreaterThanOrEqual(1);
      });
    });

    it("navigates back when clicking the back arrow", async () => {
      const user = await navigateToRelation();
      await waitFor(() => expect(screen.getByLabelText("Go back")).toBeInTheDocument());
      await user.click(screen.getByLabelText("Go back"));
      await waitFor(() => {
        expect(screen.queryByTestId("breadcrumb-trail")).not.toBeInTheDocument();
      });
    });
  });
});
