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
    rpc: vi.fn().mockResolvedValue({ error: null }),
    from: () => ({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: { id: "user-1" } } }),
    },
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const defaultProps = {
  campaignId: "campaign-1",
  event: mockEvent,
  role: "gm",
};

describe("EventDetail — Display", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders event content", () => {
    render(<EventDetail {...defaultProps} />);
    expect(screen.getByText(/party arrived at ironhold/i)).toBeInTheDocument();
  });

  it("renders event summary", () => {
    render(<EventDetail {...defaultProps} />);
    expect(screen.getByText("Party arrives at Ironhold")).toBeInTheDocument();
  });

  it("renders event type badge", () => {
    render(<EventDetail {...defaultProps} />);
    expect(screen.getByText("scene")).toBeInTheDocument();
  });

  it("renders weight badge", () => {
    render(<EventDetail {...defaultProps} />);
    expect(screen.getByText("w3")).toBeInTheDocument();
  });

  it("renders narrative day", () => {
    render(<EventDetail {...defaultProps} />);
    expect(screen.getByText(/day 1/i)).toBeInTheDocument();
  });

  it("renders time of day label", () => {
    render(<EventDetail {...defaultProps} />);
    expect(screen.getByText(/morning/i)).toBeInTheDocument();
  });
});

describe("EventDetail — Edit (EVT-04)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows edit button for GMs", () => {
    render(<EventDetail {...defaultProps} />);
    expect(screen.getAllByText(/edit/i).length).toBeGreaterThanOrEqual(1);
  });

  it("hides edit button for players", () => {
    render(<EventDetail {...defaultProps} role="player" />);
    expect(screen.queryByText(/^edit$/i)).not.toBeInTheDocument();
  });

  it("enters edit mode with form fields", async () => {
    const user = userEvent.setup();
    render(<EventDetail {...defaultProps} />);
    await user.click(screen.getAllByText(/edit/i)[0]);
    expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/summary/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/weight/i)).toBeInTheDocument();
  });

  it("shows save and cancel in edit mode", async () => {
    const user = userEvent.setup();
    render(<EventDetail {...defaultProps} />);
    await user.click(screen.getAllByText(/edit/i)[0]);
    expect(screen.getByText(/save/i)).toBeInTheDocument();
    expect(screen.getByText(/cancel/i)).toBeInTheDocument();
  });
});

describe("EventDetail — Resolve (EVT-05)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows resolve button for unresolved events", () => {
    render(<EventDetail {...defaultProps} />);
    expect(screen.getByText(/resolve/i)).toBeInTheDocument();
  });

  it("hides resolve button when already resolved", () => {
    const resolved = { ...mockEvent, resolved: true };
    render(<EventDetail {...defaultProps} event={resolved} />);
    expect(screen.queryByText(/^resolve$/i)).not.toBeInTheDocument();
    expect(screen.getByText(/resolved/i)).toBeInTheDocument();
  });

  it("shows resolved badge after resolving", async () => {
    const user = userEvent.setup();
    render(<EventDetail {...defaultProps} />);
    await user.click(screen.getByText(/resolve/i));
    expect(screen.getByText(/resolved/i)).toBeInTheDocument();
  });

  it("hides resolve button for players", () => {
    render(<EventDetail {...defaultProps} role="player" />);
    expect(screen.queryByText(/resolve/i)).not.toBeInTheDocument();
  });
});

describe("EventDetail — Trigger Condition (EVT-06)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not show trigger condition when null", () => {
    render(<EventDetail {...defaultProps} />);
    expect(screen.queryByText(/trigger/i)).not.toBeInTheDocument();
  });

  it("shows trigger condition when present", () => {
    const withTrigger = {
      ...mockEvent,
      trigger_condition: "When the full moon rises",
    };
    render(<EventDetail {...defaultProps} event={withTrigger} />);
    expect(
      screen.getByText(/when the full moon rises/i)
    ).toBeInTheDocument();
  });

  it("can edit trigger condition in edit mode", async () => {
    const user = userEvent.setup();
    render(<EventDetail {...defaultProps} />);
    await user.click(screen.getAllByText(/edit/i)[0]);
    expect(screen.getByLabelText(/trigger/i)).toBeInTheDocument();
  });
});

describe("EventDetail — Delete callback", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls onDeleted after successful delete", async () => {
    const onDeleted = vi.fn();
    const user = userEvent.setup();
    render(<EventDetail {...defaultProps} onDeleted={onDeleted} />);
    const trashBtn = screen
      .getAllByRole("button")
      .find((b) => b.querySelector('[class*="text-red"]'));
    await user.click(trashBtn!);
    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(onDeleted).toHaveBeenCalled();
  });
});
