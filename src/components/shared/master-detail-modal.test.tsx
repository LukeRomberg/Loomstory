import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MasterDetailModal } from "./master-detail-modal";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const mockItems = [
  { id: "1", name: "Gareth the Bold" },
  { id: "2", name: "Marta the Innkeeper" },
  { id: "3", name: "Vexilrath" },
];

const defaultProps = {
  title: "NPCs",
  open: true,
  onOpenChange: vi.fn(),
  items: mockItems,
  loading: false,
  renderListItem: (item: { id: string; name: string }) => (
    <div key={item.id}>{item.name}</div>
  ),
  renderDetail: (item: { id: string; name: string }) => (
    <div>Detail: {item.name}</div>
  ),
  onCreateClick: vi.fn(),
  createLabel: "New NPC",
};

describe("MasterDetailModal — List View", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the title", () => {
    render(<MasterDetailModal {...defaultProps} />);
    expect(screen.getByText("NPCs")).toBeInTheDocument();
  });

  it("renders all list items", () => {
    render(<MasterDetailModal {...defaultProps} />);
    expect(screen.getByText("Gareth the Bold")).toBeInTheDocument();
    expect(screen.getByText("Marta the Innkeeper")).toBeInTheDocument();
    expect(screen.getByText("Vexilrath")).toBeInTheDocument();
  });

  it("shows + create button", () => {
    render(<MasterDetailModal {...defaultProps} />);
    expect(screen.getByText("New NPC")).toBeInTheDocument();
  });

  it("calls onCreateClick when + is clicked", async () => {
    const user = userEvent.setup();
    render(<MasterDetailModal {...defaultProps} />);
    await user.click(screen.getByText("New NPC"));
    expect(defaultProps.onCreateClick).toHaveBeenCalledOnce();
  });

  it("does not show detail sidebar initially", () => {
    render(<MasterDetailModal {...defaultProps} />);
    expect(screen.queryByText(/Detail:/)).not.toBeInTheDocument();
  });

  it("hides create button when onCreateClick is not provided", () => {
    render(<MasterDetailModal {...defaultProps} onCreateClick={undefined} createLabel={undefined} />);
    expect(screen.queryByText("New NPC")).not.toBeInTheDocument();
  });
});

describe("MasterDetailModal — Loading", () => {
  it("does not show items when loading is true", () => {
    render(<MasterDetailModal {...defaultProps} loading={true} items={mockItems} />);
    // Items should not be visible while loading
    expect(screen.queryByText("Gareth the Bold")).not.toBeInTheDocument();
  });

  it("does not show list items when loading", () => {
    render(<MasterDetailModal {...defaultProps} loading={true} />);
    expect(screen.queryByText("Gareth the Bold")).not.toBeInTheDocument();
  });
});

describe("MasterDetailModal — Detail Sidebar", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows detail sidebar when an item is clicked", async () => {
    const user = userEvent.setup();
    render(<MasterDetailModal {...defaultProps} />);
    await user.click(screen.getByText("Gareth the Bold"));
    expect(screen.getByText("Detail: Gareth the Bold")).toBeInTheDocument();
  });

  it("shows close button on sidebar", async () => {
    const user = userEvent.setup();
    render(<MasterDetailModal {...defaultProps} />);
    await user.click(screen.getByText("Gareth the Bold"));
    expect(screen.getByRole("button", { name: /close detail/i })).toBeInTheDocument();
  });

  it("closes sidebar when close button is clicked", async () => {
    const user = userEvent.setup();
    render(<MasterDetailModal {...defaultProps} />);
    await user.click(screen.getByText("Gareth the Bold"));
    expect(screen.getByText("Detail: Gareth the Bold")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /close detail/i }));
    expect(screen.queryByText("Detail: Gareth the Bold")).not.toBeInTheDocument();
  });

  it("switches detail when a different item is clicked", async () => {
    const user = userEvent.setup();
    render(<MasterDetailModal {...defaultProps} />);
    await user.click(screen.getByText("Gareth the Bold"));
    expect(screen.getByText("Detail: Gareth the Bold")).toBeInTheDocument();

    await user.click(screen.getByText("Marta the Innkeeper"));
    expect(screen.getByText("Detail: Marta the Innkeeper")).toBeInTheDocument();
    expect(screen.queryByText("Detail: Gareth the Bold")).not.toBeInTheDocument();
  });

  it("keeps list visible when detail is open", async () => {
    const user = userEvent.setup();
    render(<MasterDetailModal {...defaultProps} />);
    await user.click(screen.getByText("Gareth the Bold"));
    // List items should still be visible
    expect(screen.getByText("Marta the Innkeeper")).toBeInTheDocument();
    expect(screen.getByText("Vexilrath")).toBeInTheDocument();
  });
});

describe("MasterDetailModal — Empty State", () => {
  it("shows empty state when items is empty and not loading", () => {
    render(<MasterDetailModal {...defaultProps} items={[]} />);
    expect(screen.getByText(/no items/i) || screen.getByText(/empty/i)).toBeTruthy();
  });
});
