import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CampaignSelectScreen } from "./campaign-select-screen";

const mockPush = vi.fn();
vi.mock("@/hooks/use-transition-router", () => ({
  useTransitionRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
    isPending: false,
  }),
}));

const mockCampaignSingle = vi.fn();
const mockMemberInsert = vi.fn();
const mockCampaignInsert = vi.fn((_payload: Record<string, unknown>) => ({
  select: () => ({ single: mockCampaignSingle }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table === "campaigns") {
        return { insert: mockCampaignInsert };
      }
      if (table === "campaign_members") {
        return { insert: mockMemberInsert };
      }
      return {};
    },
  }),
}));

vi.mock("@/hooks/use-game-icons", () => ({
  useGameIcons: () => ({
    icons: ["game-icons:wolf-head", "game-icons:castle", "game-icons:wyvern"],
    loading: false,
    error: null,
  }),
  FALLBACK_GAME_ICONS: [
    "game-icons:wolf-head",
    "game-icons:castle",
    "game-icons:wyvern",
  ],
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), loading: vi.fn() },
}));

function makeCampaign(i: number, role: "gm" | "player" = "gm") {
  return {
    id: `c${i}`,
    name: `Campaign ${i}`,
    description: null,
    cover_image_url: null,
    system_id: null,
    emblem: null as string | null,
    created_at: "2026-05-18T00:00:00Z",
    role,
  };
}

describe("CampaignSelectScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMemberInsert.mockResolvedValue({ error: null });
  });

  describe("rendering", () => {
    it("renders a hotspot for each provided campaign", () => {
      render(
        <CampaignSelectScreen
          campaigns={[makeCampaign(1), makeCampaign(2, "player")]}
          systems={[]}
          userId="u1"
        />
      );
      expect(screen.getByLabelText("Campaign 1")).toBeInTheDocument();
      expect(screen.getByLabelText("Campaign 2")).toBeInTheDocument();
    });

    it("maps system_id to a visible system name on each book", () => {
      const c = { ...makeCampaign(1), system_id: "s1" };
      render(
        <CampaignSelectScreen
          campaigns={[c]}
          systems={[{ id: "s1", name: "Daggerheart", slug: "daggerheart" }]}
          userId="u1"
        />
      );
      expect(screen.getByText("Daggerheart")).toBeInTheDocument();
    });

    it("paginates internally to flip between sets of 9", async () => {
      const user = userEvent.setup();
      const many = Array.from({ length: 12 }, (_, i) => makeCampaign(i + 1));
      render(
        <CampaignSelectScreen campaigns={many} systems={[]} userId="u1" />
      );

      expect(screen.getByLabelText("Campaign 1")).toBeInTheDocument();
      expect(screen.queryByLabelText("Campaign 10")).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /next shelf/i }));

      expect(screen.queryByLabelText("Campaign 1")).not.toBeInTheDocument();
      expect(screen.getByLabelText("Campaign 10")).toBeInTheDocument();
    });
  });

  describe("create dialog", () => {
    it("opens the dialog when the + button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <CampaignSelectScreen
          campaigns={[]}
          systems={[{ id: "s1", name: "Daggerheart", slug: "daggerheart" }]}
          userId="u1"
        />
      );
      await user.click(screen.getByRole("button", { name: /new campaign/i }));
      expect(screen.getByLabelText(/campaign name/i)).toBeInTheDocument();
    });

    it("creates a campaign and navigates to it on submit", async () => {
      mockCampaignSingle.mockResolvedValue({
        data: {
          id: "new-id",
          name: "Saga",
          description: null,
          cover_image_url: null,
          system_id: null,
          created_at: "2026-05-18T00:00:00Z",
        },
        error: null,
      });

      const user = userEvent.setup();
      render(
        <CampaignSelectScreen
          campaigns={[]}
          systems={[{ id: "s1", name: "Daggerheart", slug: "daggerheart" }]}
          userId="u1"
        />
      );
      await user.click(screen.getByRole("button", { name: /new campaign/i }));
      await user.type(screen.getByLabelText(/campaign name/i), "Saga");
      await user.click(
        screen.getByRole("button", { name: /^create campaign$/i })
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/campaign/new-id");
      });
    });

    it("renders the emblem picker inside the create dialog", async () => {
      const user = userEvent.setup();
      render(
        <CampaignSelectScreen
          campaigns={[]}
          systems={[{ id: "s1", name: "Daggerheart", slug: "daggerheart" }]}
          userId="u1"
        />
      );
      await user.click(screen.getByRole("button", { name: /new campaign/i }));
      expect(screen.getByPlaceholderText(/search emblems/i)).toBeInTheDocument();
    });

    it("includes the selected emblem in the insert payload", async () => {
      mockCampaignSingle.mockResolvedValue({
        data: {
          id: "new-id",
          name: "Saga",
          description: null,
          cover_image_url: null,
          system_id: null,
          emblem: "game-icons:wyvern",
          created_at: "2026-05-18T00:00:00Z",
        },
        error: null,
      });

      const user = userEvent.setup();
      render(
        <CampaignSelectScreen
          campaigns={[]}
          systems={[]}
          userId="u1"
        />
      );
      await user.click(screen.getByRole("button", { name: /new campaign/i }));
      await user.type(screen.getByLabelText(/campaign name/i), "Saga");
      await user.click(screen.getByRole("button", { name: /wyvern/i }));
      await user.click(
        screen.getByRole("button", { name: /^create campaign$/i })
      );

      await waitFor(() => {
        expect(mockCampaignInsert).toHaveBeenCalled();
      });
      const payload = mockCampaignInsert.mock.calls[0]?.[0];
      expect(payload).toMatchObject({
        name: "Saga",
        emblem: "game-icons:wyvern",
      });
    });

    it("does not navigate when creation fails", async () => {
      mockCampaignSingle.mockResolvedValue({
        data: null,
        error: { message: "permission denied" },
      });

      const user = userEvent.setup();
      render(
        <CampaignSelectScreen
          campaigns={[]}
          systems={[{ id: "s1", name: "Daggerheart", slug: "daggerheart" }]}
          userId="u1"
        />
      );
      await user.click(screen.getByRole("button", { name: /new campaign/i }));
      await user.type(screen.getByLabelText(/campaign name/i), "Saga");
      await user.click(
        screen.getByRole("button", { name: /^create campaign$/i })
      );

      await waitFor(() => {
        expect(mockCampaignSingle).toHaveBeenCalled();
      });
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
