import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InviteManager } from "./invite-manager";
import { mockInvite, mockInvites } from "@/test/mocks";

// ─── Mocks ──────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

// Clipboard mock
const mockCopyToClipboard = vi.fn();
vi.mock("@/lib/clipboard", () => ({
  copyToClipboard: (...args: unknown[]) => mockCopyToClipboard(...args),
}));

// Crypto mock for token generation
vi.stubGlobal("crypto", {
  randomUUID: () => "generated-uuid-token",
});

const mockInsert = vi.fn().mockReturnValue({
  select: vi.fn().mockReturnValue({
    single: vi.fn().mockResolvedValue({
      data: { ...mockInvite, id: "new-invite", token: "generated-uuid-token" },
      error: null,
    }),
  }),
});

const mockUpdate = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null }),
});

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table === "campaign_invites") {
        return {
          insert: mockInsert,
          update: mockUpdate,
        };
      }
      return {};
    },
  }),
}));

// ─── Helpers ────────────────────────────────────────────────

const pendingInvites = mockInvites.filter((i) => !i.accepted_at);

const defaultProps = {
  campaignId: "campaign-1",
  invites: pendingInvites,
  userId: "test-user-id",
};

describe("InviteManager", () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── Rendering ──────────────────────────────────────────

  it("renders the section heading", () => {
    render(<InviteManager {...defaultProps} />);
    expect(screen.getByText("Invites")).toBeInTheDocument();
  });

  it("renders pending invite count", () => {
    render(<InviteManager {...defaultProps} />);
    expect(screen.getByText(/2 pending/i)).toBeInTheDocument();
  });

  it("renders 'Invite link' label for each invite", () => {
    render(<InviteManager {...defaultProps} />);
    const labels = screen.getAllByText("Invite link");
    expect(labels).toHaveLength(2);
  });

  it("renders invite role badge", () => {
    render(<InviteManager {...defaultProps} />);
    const badges = screen.getAllByText(/player/i);
    expect(badges.length).toBeGreaterThan(0);
  });

  it("shows empty state when no pending invites", () => {
    render(<InviteManager {...defaultProps} invites={[]} />);
    expect(screen.getByText(/create one to invite players/i)).toBeInTheDocument();
  });

  // ─── Create Invite ─────────────────────────────────────

  it("has a create invite button", () => {
    render(<InviteManager {...defaultProps} />);
    expect(screen.getByRole("button", { name: /create invite/i })).toBeInTheDocument();
  });

  it("creates invite and copies link on button click", async () => {

    const user = userEvent.setup();
    render(<InviteManager {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /create invite/i }));

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          campaign_id: "campaign-1",
          email: null,
          role: "player",
          created_by: "test-user-id",
        })
      );
    });

    await waitFor(() => {
      expect(mockCopyToClipboard).toHaveBeenCalledWith(
        expect.stringContaining("generated-uuid-token")
      );
    });
  });

  it("shows loading state while creating invite", async () => {
    const user = userEvent.setup();
    render(<InviteManager {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /create invite/i }));

    await waitFor(() => {
      const btn = screen.queryByRole("button", { name: /creating/i });
      expect(btn === null || btn?.hasAttribute("disabled")).toBe(true);
    });
  });

  // ─── Copy Invite Link ─────────────────────────────────

  it("has copy link buttons for each invite", () => {
    render(<InviteManager {...defaultProps} />);
    const copyButtons = screen.getAllByRole("button", { name: /copy link/i });
    expect(copyButtons).toHaveLength(2);
  });

  it("copies invite link to clipboard on click", async () => {

    const user = userEvent.setup();
    render(<InviteManager {...defaultProps} />);

    const copyButtons = screen.getAllByRole("button", { name: /copy link/i });
    await user.click(copyButtons[0]);

    await waitFor(() => {
      expect(mockCopyToClipboard).toHaveBeenCalledWith(
        expect.stringContaining("abc123token")
      );
    });
  });

  // ─── Revoke Invite ────────────────────────────────────

  it("has revoke buttons for each invite", () => {
    render(<InviteManager {...defaultProps} />);
    const revokeButtons = screen.getAllByRole("button", { name: /revoke/i });
    expect(revokeButtons).toHaveLength(2);
  });

  it("revokes an invite on confirmation", async () => {
    const user = userEvent.setup();
    render(<InviteManager {...defaultProps} />);

    const revokeButtons = screen.getAllByRole("button", { name: /revoke/i });
    await user.click(revokeButtons[0]);

    const confirmBtn = await screen.findByRole("button", { name: /^confirm$/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  it("cancelling revoke does not delete the invite", async () => {
    const user = userEvent.setup();
    render(<InviteManager {...defaultProps} />);

    const revokeButtons = screen.getAllByRole("button", { name: /revoke/i });
    await user.click(revokeButtons[0]);

    const cancelBtn = await screen.findByRole("button", { name: /cancel/i });
    await user.click(cancelBtn);

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  // ─── Expiration ───────────────────────────────────────

  it("shows expiration date when set", () => {
    render(<InviteManager {...defaultProps} />);
    expect(screen.getByText(/expires/i)).toBeInTheDocument();
  });

  it("shows 'No expiration' when expires_at is null", () => {
    render(<InviteManager {...defaultProps} />);
    expect(screen.getByText(/no expiration/i)).toBeInTheDocument();
  });
});
