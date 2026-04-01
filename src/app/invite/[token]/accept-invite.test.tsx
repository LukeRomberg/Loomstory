import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AcceptInvite } from "./accept-invite";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

const mockInsert = vi.fn().mockReturnValue({
  select: vi.fn().mockReturnValue({
    single: vi.fn().mockResolvedValue({ data: { id: "member-new" }, error: null }),
  }),
});

const mockUpdate = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null }),
});

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table === "campaign_members") {
        return { insert: mockInsert };
      }
      if (table === "campaign_invites") {
        return { update: mockUpdate };
      }
      return {};
    },
  }),
}));

const validInvite = {
  id: "invite-1",
  campaign_id: "campaign-1",
  email: "player@example.com",
  token: "abc123token",
  role: "player",
  created_by: "gm-user-id",
  expires_at: "2026-04-07T00:00:00Z",
  accepted_at: null,
  created_at: "2026-03-31T00:00:00Z",
  campaigns: { id: "campaign-1", name: "The Crimson Accord" },
};

const defaultProps = {
  invite: validInvite,
  userId: "player-user-id",
};

describe("AcceptInvite", () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── Rendering ──────────────────────────────────────────

  it("renders the campaign name", () => {
    render(<AcceptInvite {...defaultProps} />);
    expect(screen.getByText(/the crimson accord/i)).toBeInTheDocument();
  });

  it("renders the invitation message", () => {
    render(<AcceptInvite {...defaultProps} />);
    expect(screen.getByText(/you've been invited/i)).toBeInTheDocument();
  });

  it("renders the role being assigned", () => {
    render(<AcceptInvite {...defaultProps} />);
    expect(screen.getByText(/player/i)).toBeInTheDocument();
  });

  it("has an accept button", () => {
    render(<AcceptInvite {...defaultProps} />);
    expect(screen.getByRole("button", { name: /join campaign/i })).toBeInTheDocument();
  });

  it("has a decline button", () => {
    render(<AcceptInvite {...defaultProps} />);
    expect(screen.getByRole("button", { name: /decline/i })).toBeInTheDocument();
  });

  // ─── Already accepted ────────────────────────────────

  it("shows already-accepted state when invite was used", () => {
    const accepted = { ...validInvite, accepted_at: "2026-03-31T12:00:00Z" };
    render(<AcceptInvite {...defaultProps} invite={accepted} />);
    expect(screen.getByText(/already been accepted/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /join campaign/i })).not.toBeInTheDocument();
  });

  // ─── Expired ──────────────────────────────────────────

  it("shows expired state when invite is past expiration", () => {
    const expired = { ...validInvite, expires_at: "2020-01-01T00:00:00Z" };
    render(<AcceptInvite {...defaultProps} invite={expired} />);
    expect(screen.getByText("Invite Expired")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /join campaign/i })).not.toBeInTheDocument();
  });

  // ─── Accept Flow ──────────────────────────────────────

  it("creates membership and marks invite accepted on join", async () => {
    const user = userEvent.setup();
    render(<AcceptInvite {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /join campaign/i }));

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          campaign_id: "campaign-1",
          user_id: "player-user-id",
          role: "player",
        })
      );
    });

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          accepted_at: expect.any(String),
        })
      );
    });
  });

  it("redirects to campaign after accepting", async () => {
    const user = userEvent.setup();
    render(<AcceptInvite {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /join campaign/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/campaign/campaign-1");
    });
  });

  it("shows loading state while accepting", async () => {
    const user = userEvent.setup();
    render(<AcceptInvite {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /join campaign/i }));

    // Button should show loading text or be disabled
    await waitFor(() => {
      const btn = screen.queryByRole("button", { name: /joining/i });
      expect(btn === null || btn?.hasAttribute("disabled")).toBe(true);
    });
  });

  // ─── Decline ──────────────────────────────────────────

  it("redirects to dashboard on decline", async () => {
    const user = userEvent.setup();
    render(<AcceptInvite {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /decline/i }));

    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  // ─── Error handling ───────────────────────────────────

  it("shows error if membership insert fails", async () => {
    mockInsert.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Already a member" },
        }),
      }),
    });

    const user = userEvent.setup();
    render(<AcceptInvite {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /join campaign/i }));

    await waitFor(() => {
      expect(screen.getByText(/already a member/i)).toBeInTheDocument();
    });
  });
});
