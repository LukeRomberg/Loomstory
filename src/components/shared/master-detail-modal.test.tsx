import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

describe("MasterDetailModal — Search", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not render search input when searchPlaceholder is not provided", () => {
    render(<MasterDetailModal {...defaultProps} />);
    expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument();
  });

  it("renders search input when searchPlaceholder is provided", () => {
    render(<MasterDetailModal {...defaultProps} searchPlaceholder="Search NPCs..." />);
    expect(screen.getByPlaceholderText("Search NPCs...")).toBeInTheDocument();
  });

  it("filters items by name (case-insensitive) as user types", () => {
    render(<MasterDetailModal {...defaultProps} searchPlaceholder="Search..." />);
    fireEvent.change(screen.getByPlaceholderText("Search..."), { target: { value: "marta" } });
    expect(screen.getByText("Marta the Innkeeper")).toBeInTheDocument();
    expect(screen.queryByText("Gareth the Bold")).not.toBeInTheDocument();
    expect(screen.queryByText("Vexilrath")).not.toBeInTheDocument();
  });

  it("shows all items when search is cleared", () => {
    render(<MasterDetailModal {...defaultProps} searchPlaceholder="Search..." />);
    const input = screen.getByPlaceholderText("Search...");
    fireEvent.change(input, { target: { value: "marta" } });
    fireEvent.change(input, { target: { value: "" } });
    expect(screen.getByText("Gareth the Bold")).toBeInTheDocument();
    expect(screen.getByText("Marta the Innkeeper")).toBeInTheDocument();
    expect(screen.getByText("Vexilrath")).toBeInTheDocument();
  });

  it("shows no-results message when search matches nothing", () => {
    render(<MasterDetailModal {...defaultProps} searchPlaceholder="Search..." />);
    fireEvent.change(screen.getByPlaceholderText("Search..."), { target: { value: "zzznotreal" } });
    expect(screen.getByText(/no results/i)).toBeInTheDocument();
  });

  it("searches across all string/number fields by default", () => {
    const itemsWithExtras = [
      { id: "1", name: "Gareth", description: "A bold warrior", tags: ["fighter"] },
      { id: "2", name: "Marta", description: "Innkeeper", tags: ["merchant", "friendly"] },
      { id: "3", name: "Vexilrath", description: "Mysterious figure", tags: ["villain"] },
    ];
    render(
      <MasterDetailModal
        {...defaultProps}
        items={itemsWithExtras}
        renderListItem={(i) => <div>{i.name}</div>}
        renderDetail={(i) => <div>Detail: {i.name}</div>}
        searchPlaceholder="Search..."
      />
    );
    const input = screen.getByPlaceholderText("Search...");

    fireEvent.change(input, { target: { value: "bold" } });
    expect(screen.getByText("Gareth")).toBeInTheDocument();
    expect(screen.queryByText("Marta")).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: "merchant" } });
    expect(screen.getByText("Marta")).toBeInTheDocument();
    expect(screen.queryByText("Gareth")).not.toBeInTheDocument();
  });

  it("does not match on object keys (e.g. searching 'name' should not match everything)", () => {
    render(<MasterDetailModal {...defaultProps} searchPlaceholder="Search..." />);
    fireEvent.change(screen.getByPlaceholderText("Search..."), { target: { value: "name" } });
    expect(screen.getByText(/no results/i)).toBeInTheDocument();
  });

  it("preserves selected detail when search filters the list", async () => {
    const user = userEvent.setup();
    render(<MasterDetailModal {...defaultProps} searchPlaceholder="Search..." />);
    await user.click(screen.getByText("Gareth the Bold"));
    expect(screen.getByText("Detail: Gareth the Bold")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Search..."), { target: { value: "marta" } });
    expect(screen.getByText("Detail: Gareth the Bold")).toBeInTheDocument();
  });
});

describe("MasterDetailModal — initialSelectedId", () => {
  beforeEach(() => vi.clearAllMocks());

  it("opens with the matching item already selected when initialSelectedId is set", () => {
    render(<MasterDetailModal {...defaultProps} initialSelectedId="2" />);
    expect(screen.getByText("Detail: Marta the Innkeeper")).toBeInTheDocument();
  });

  it("switches the selected detail when initialSelectedId changes while open", () => {
    const { rerender } = render(
      <MasterDetailModal {...defaultProps} initialSelectedId="1" />
    );
    expect(screen.getByText("Detail: Gareth the Bold")).toBeInTheDocument();

    rerender(<MasterDetailModal {...defaultProps} initialSelectedId="3" />);
    expect(screen.getByText("Detail: Vexilrath")).toBeInTheDocument();
    expect(screen.queryByText("Detail: Gareth the Bold")).not.toBeInTheDocument();
  });

  it("falls back to no selection when initialSelectedId is undefined", () => {
    render(<MasterDetailModal {...defaultProps} />);
    expect(screen.queryByText(/Detail:/)).not.toBeInTheDocument();
  });

  it("ignores initialSelectedId that does not match any item id", () => {
    render(<MasterDetailModal {...defaultProps} initialSelectedId="ghost" />);
    expect(screen.queryByText(/Detail:/)).not.toBeInTheDocument();
  });
});
