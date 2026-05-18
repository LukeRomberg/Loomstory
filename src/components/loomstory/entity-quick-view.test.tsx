import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EntityQuickView } from "./entity-quick-view";
import { mockNpc } from "@/test/mocks";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}));

const defaultProps = {
  entity: mockNpc,
  entityType: "npc" as const,
  campaignId: "campaign-1",
  role: "gm",
  open: true,
  onClose: vi.fn(),
};

describe("EntityQuickView", () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── Rendering ────────────────────────────────────────────

  it("renders entity name", () => {
    render(<EntityQuickView {...defaultProps} />);
    expect(screen.getByText("Gareth the Bold")).toBeInTheDocument();
  });

  it("renders entity description", () => {
    render(<EntityQuickView {...defaultProps} />);
    expect(screen.getByText(/tall, scarred warrior/)).toBeInTheDocument();
  });

  it("renders status badge", () => {
    render(<EntityQuickView {...defaultProps} />);
    expect(screen.getByText("alive")).toBeInTheDocument();
  });

  it("renders tags", () => {
    render(<EntityQuickView {...defaultProps} />);
    expect(screen.getByText("ally")).toBeInTheDocument();
    expect(screen.getByText("warrior")).toBeInTheDocument();
  });

  it("renders aliases", () => {
    render(<EntityQuickView {...defaultProps} />);
    expect(screen.getByText(/Gareth, The Bold One/)).toBeInTheDocument();
  });

  it("shows GM notes for GM role", () => {
    render(<EntityQuickView {...defaultProps} />);
    expect(screen.getByText(/secretly working for the enemy/i)).toBeInTheDocument();
  });

  it("hides GM notes for player role", () => {
    render(<EntityQuickView {...defaultProps} role="player" />);
    expect(screen.queryByText(/secretly working for the enemy/i)).not.toBeInTheDocument();
  });

  // ─── Navigation ───────────────────────────────────────────

  it("has a 'View Details' link to full detail page", () => {
    render(<EntityQuickView {...defaultProps} />);
    expect(screen.getByText(/view details/i)).toBeInTheDocument();
  });

  it("navigates to detail page when 'View Details' is clicked", async () => {
    const user = userEvent.setup();
    render(<EntityQuickView {...defaultProps} />);
    await user.click(screen.getByText(/view details/i));
    expect(mockPush).toHaveBeenCalledWith(
      "/campaign/campaign-1/npcs?selected=npc-1"
    );
  });

  // ─── Close ────────────────────────────────────────────────

  it("does not render when open is false", () => {
    render(<EntityQuickView {...defaultProps} open={false} />);
    expect(screen.queryByText("Gareth the Bold")).not.toBeInTheDocument();
  });
});
