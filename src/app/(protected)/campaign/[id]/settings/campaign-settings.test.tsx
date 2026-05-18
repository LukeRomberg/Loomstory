import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CampaignSettings } from "./campaign-settings";

vi.mock("@/hooks/use-transition-router", () => ({
  useTransitionRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/hooks/use-game-icons", () => ({
  useGameIcons: () => ({
    icons: ["game-icons:wolf-head", "game-icons:castle", "game-icons:wyvern"],
    loading: false,
    error: null,
  }),
  FALLBACK_GAME_ICONS: ["game-icons:wolf-head"],
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockEq = vi.fn().mockResolvedValue({ error: null });
const mockUpdate = vi.fn((_payload: Record<string, unknown>) => ({
  eq: mockEq,
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({ update: mockUpdate }),
    rpc: vi.fn().mockResolvedValue({ error: null }),
  }),
}));

const baseCampaign = {
  id: "c1",
  name: "Alpha",
  description: null,
  system_id: null,
  house_rules: null,
  cover_image_url: null,
  emblem: null as string | null,
};

describe("CampaignSettings — emblem picker", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the emblem picker", () => {
    render(<CampaignSettings campaign={baseCampaign} systems={[]} />);
    expect(screen.getByPlaceholderText(/search emblems/i)).toBeInTheDocument();
  });

  it("pre-selects the campaign's current emblem", () => {
    render(
      <CampaignSettings
        campaign={{ ...baseCampaign, emblem: "game-icons:castle" }}
        systems={[]}
      />
    );
    expect(
      screen.getByRole("button", { name: /castle/i })
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("includes the chosen emblem in the update payload", async () => {
    const user = userEvent.setup();
    render(<CampaignSettings campaign={baseCampaign} systems={[]} />);

    await user.click(screen.getByRole("button", { name: /wyvern/i }));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(mockUpdate).toHaveBeenCalled());
    expect(mockUpdate.mock.calls[0]?.[0]).toMatchObject({
      emblem: "game-icons:wyvern",
    });
  });
});
