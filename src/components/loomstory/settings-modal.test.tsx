import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsModal } from "./settings-modal";
import { mockCampaign, mockSystems, mockInvites, mockMembers } from "@/test/mocks";

// ─── Mocks ──────────────────────────────────────────────────

const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

// Clipboard mock
beforeEach(() => {
  if (!navigator.clipboard) {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
  } else {
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
  }
});

vi.stubGlobal("crypto", {
  randomUUID: () => "generated-uuid-token",
});

const pendingInvites = mockInvites.filter((i) => !i.accepted_at);

const mockFrom = vi.fn((table: string) => {
  if (table === "campaigns") {
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockCampaign, error: null }),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    };
  }
  if (table === "systems") {
    return {
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockSystems, error: null }),
      }),
    };
  }
  if (table === "campaign_invites") {
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: pendingInvites, error: null }),
          }),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { ...pendingInvites[0], id: "new-invite", token: "generated-uuid-token" },
            error: null,
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    };
  }
  if (table === "campaign_members") {
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockMembers, error: null }),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    };
  }
  return {};
});

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from: mockFrom }),
}));

const defaultProps = {
  campaignId: "campaign-1",
  userId: "test-user-id",
  open: true,
  onOpenChange: vi.fn(),
};

describe("SettingsModal", () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── Loading & Structure ────────────────────────────────

  it("renders the modal title", async () => {
    render(<SettingsModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText("Campaign Settings")).toBeInTheDocument();
    });
  });

  it("fetches data on open", async () => {
    render(<SettingsModal {...defaultProps} />);
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith("campaigns");
      expect(mockFrom).toHaveBeenCalledWith("systems");
      expect(mockFrom).toHaveBeenCalledWith("campaign_members");
      expect(mockFrom).toHaveBeenCalledWith("campaign_invites");
    });
  });

  it("does not fetch when closed", () => {
    render(<SettingsModal {...defaultProps} open={false} />);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  // ─── General Settings Section ─────────────────────────

  it("renders campaign name input", async () => {
    render(<SettingsModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByLabelText(/campaign name/i)).toBeInTheDocument();
    });
  });

  it("populates campaign name from fetched data", async () => {
    render(<SettingsModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByLabelText(/campaign name/i)).toHaveValue(mockCampaign.name);
    });
  });

  it("has a save button for general settings", async () => {
    render(<SettingsModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
    });
  });

  // ─── Members Section ──────────────────────────────────

  it("renders members section", async () => {
    render(<SettingsModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText("Members")).toBeInTheDocument();
    });
  });

  it("renders member names", async () => {
    render(<SettingsModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText("Test GM")).toBeInTheDocument();
      expect(screen.getByText("Player One")).toBeInTheDocument();
    });
  });

  // ─── Invites Section ──────────────────────────────────

  it("renders invites section", async () => {
    render(<SettingsModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText("Invites")).toBeInTheDocument();
    });
  });

  it("renders pending invites", async () => {
    render(<SettingsModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText(/2 pending/i)).toBeInTheDocument();
    });
  });

  it("has a create invite button", async () => {
    render(<SettingsModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create invite/i })).toBeInTheDocument();
    });
  });

  // ─── Danger Zone ──────────────────────────────────────

  it("renders archive button", async () => {
    render(<SettingsModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /archive campaign/i })).toBeInTheDocument();
    });
  });
});
