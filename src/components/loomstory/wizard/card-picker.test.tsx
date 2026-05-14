import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CardPicker } from "./card-picker";
import type { PickerCard } from "./card-picker";

const mockCards: PickerCard[] = [
  {
    id: "warrior",
    title: "Warrior",
    description: "A fearless combatant",
    badges: [{ label: "Blade" }, { label: "Bone" }],
    stats: [
      { label: "HP", value: "6" },
      { label: "Evasion", value: "11" },
    ],
    gradient: "from-red-950 via-rose-900 to-red-950",
    borderColor: "border-red-700",
    textColor: "text-red-300",
  },
  {
    id: "druid",
    title: "Druid",
    description: "A shapeshifting guardian of nature",
    badges: [{ label: "Sage" }, { label: "Arcana" }],
    stats: [
      { label: "HP", value: "6" },
      { label: "Evasion", value: "10" },
    ],
    gradient: "from-green-950 via-teal-950 to-green-950",
    borderColor: "border-green-600",
    textColor: "text-green-300",
  },
];

describe("CardPicker", () => {
  it("renders all cards with titles", () => {
    render(<CardPicker cards={mockCards} onSelect={vi.fn()} />);
    expect(screen.getByText("Warrior")).toBeInTheDocument();
    expect(screen.getByText("Druid")).toBeInTheDocument();
  });

  it("renders card descriptions", () => {
    render(<CardPicker cards={mockCards} onSelect={vi.fn()} />);
    expect(screen.getByText("A fearless combatant")).toBeInTheDocument();
    expect(screen.getByText("A shapeshifting guardian of nature")).toBeInTheDocument();
  });

  it("renders badges on cards", () => {
    render(<CardPicker cards={mockCards} onSelect={vi.fn()} />);
    expect(screen.getByText("Blade")).toBeInTheDocument();
    expect(screen.getByText("Bone")).toBeInTheDocument();
  });

  it("expands a card when clicked", async () => {
    const user = userEvent.setup();
    render(<CardPicker cards={mockCards} onSelect={vi.fn()} />);

    // Stats should not be visible before expansion
    expect(screen.queryByText("HP")).not.toBeInTheDocument();

    await user.click(screen.getByText("Warrior"));
    // Stats should be visible after expansion
    expect(screen.getByText("HP")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
  });

  it("shows select button when card is expanded", async () => {
    const user = userEvent.setup();
    render(<CardPicker cards={mockCards} onSelect={vi.fn()} />);

    await user.click(screen.getByText("Warrior"));
    expect(screen.getByRole("button", { name: /choose warrior/i })).toBeInTheDocument();
  });

  it("calls onSelect with card id when select button is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<CardPicker cards={mockCards} onSelect={onSelect} />);

    await user.click(screen.getByText("Warrior"));
    await user.click(screen.getByRole("button", { name: /choose warrior/i }));
    expect(onSelect).toHaveBeenCalledWith("warrior");
  });

  it("collapses expanded card when clicking it again", async () => {
    const user = userEvent.setup();
    render(<CardPicker cards={mockCards} onSelect={vi.fn()} />);

    await user.click(screen.getByText("Warrior"));
    expect(screen.getByRole("button", { name: /choose warrior/i })).toBeInTheDocument();

    await user.click(screen.getByText("Warrior"));
    expect(screen.queryByRole("button", { name: /choose warrior/i })).not.toBeInTheDocument();
  });

  it("expands a different card when clicking another while one is expanded", async () => {
    const user = userEvent.setup();
    render(<CardPicker cards={mockCards} onSelect={vi.fn()} />);

    await user.click(screen.getByText("Warrior"));
    expect(screen.getByRole("button", { name: /choose warrior/i })).toBeInTheDocument();

    await user.click(screen.getByText("Druid"));
    expect(screen.queryByRole("button", { name: /choose warrior/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /choose druid/i })).toBeInTheDocument();
  });

  it("renders detail items when card is expanded", async () => {
    const user = userEvent.setup();
    const cardsWithDetails: PickerCard[] = [
      {
        ...mockCards[0],
        details: [
          { label: "Foundation Features", items: ["No Mercy", "Attack of Opportunity"] },
        ],
      },
    ];
    render(<CardPicker cards={cardsWithDetails} onSelect={vi.fn()} />);

    await user.click(screen.getByText("Warrior"));
    expect(screen.getByText("Foundation Features")).toBeInTheDocument();
    expect(screen.getByText("No Mercy")).toBeInTheDocument();
    expect(screen.getByText("Attack of Opportunity")).toBeInTheDocument();
  });

  it("renders feature groups with name and description when card is expanded", async () => {
    const user = userEvent.setup();
    const cardsWithFeatures: PickerCard[] = [
      {
        id: "nightwalker",
        title: "Nightwalker",
        description: "Move through shadows",
        featureGroups: [
          {
            label: "Foundation Feature",
            features: [
              {
                name: "Shadow Stepper",
                description:
                  "You can move from shadow to shadow. When you move into an area of darkness, mark a Stress to disappear and reappear in another shadow within Far range.",
              },
            ],
          },
        ],
      },
    ];
    render(<CardPicker cards={cardsWithFeatures} onSelect={vi.fn()} />);

    await user.click(screen.getByText("Nightwalker"));

    expect(screen.getByText("Foundation Feature")).toBeInTheDocument();
    expect(screen.getByText("Shadow Stepper")).toBeInTheDocument();
    expect(
      screen.getByText(/You can move from shadow to shadow/)
    ).toBeInTheDocument();
  });

  it("renders multiple feature groups in order (Foundation, Specialization, Mastery)", async () => {
    const user = userEvent.setup();
    const cardsWithFeatures: PickerCard[] = [
      {
        id: "nightwalker",
        title: "Nightwalker",
        description: "Move through shadows",
        featureGroups: [
          {
            label: "Foundation Feature",
            features: [{ name: "Shadow Stepper", description: "Foundation desc." }],
          },
          {
            label: "Specialization Features",
            features: [
              { name: "Dark Cloud", description: "Spec desc one." },
              { name: "Adrenaline", description: "Spec desc two." },
            ],
          },
          {
            label: "Mastery Features",
            features: [
              { name: "Fleeting Shadow", description: "Mastery desc one." },
              { name: "Vanishing Act", description: "Mastery desc two." },
            ],
          },
        ],
      },
    ];
    render(<CardPicker cards={cardsWithFeatures} onSelect={vi.fn()} />);

    await user.click(screen.getByText("Nightwalker"));

    expect(screen.getByText("Foundation Feature")).toBeInTheDocument();
    expect(screen.getByText("Specialization Features")).toBeInTheDocument();
    expect(screen.getByText("Mastery Features")).toBeInTheDocument();

    expect(screen.getByText("Shadow Stepper")).toBeInTheDocument();
    expect(screen.getByText("Dark Cloud")).toBeInTheDocument();
    expect(screen.getByText("Adrenaline")).toBeInTheDocument();
    expect(screen.getByText("Fleeting Shadow")).toBeInTheDocument();
    expect(screen.getByText("Vanishing Act")).toBeInTheDocument();
  });

  it("switches from grid to master-detail layout when a card is expanded", async () => {
    const user = userEvent.setup();
    render(<CardPicker cards={mockCards} onSelect={vi.fn()} />);

    // Initially: grid layout, no detail panel
    expect(screen.getByTestId("card-picker-grid")).toBeInTheDocument();
    expect(screen.queryByTestId("card-picker-detail")).not.toBeInTheDocument();

    await user.click(screen.getByText("Warrior"));

    // After expansion: master-detail (list on left, detail on right)
    expect(screen.queryByTestId("card-picker-grid")).not.toBeInTheDocument();
    expect(screen.getByTestId("card-picker-list")).toBeInTheDocument();
    expect(screen.getByTestId("card-picker-detail")).toBeInTheDocument();

    // Both cards still appear in the compact list (left), expanded detail shows on the right
    const list = screen.getByTestId("card-picker-list");
    expect(list).toHaveTextContent("Warrior");
    expect(list).toHaveTextContent("Druid");

    // The detail panel shows the expanded card's stats + select button
    expect(screen.getByRole("button", { name: /choose warrior/i })).toBeInTheDocument();
  });

  it("renders loading state", () => {
    render(<CardPicker cards={[]} onSelect={vi.fn()} loading />);
    expect(screen.getByTestId("card-picker-loading")).toBeInTheDocument();
  });

  it("highlights selected card", () => {
    render(<CardPicker cards={mockCards} onSelect={vi.fn()} selectedId="warrior" />);
    // The selected card should have a visual indicator
    const warriorCard = screen.getByText("Warrior").closest("[data-card-id]");
    expect(warriorCard).toHaveAttribute("data-selected", "true");
  });
});

// ─── Multi-select mode ────────────────────────────────────────
// Domain card pick step needs exactly-N selection. Same master-detail UI,
// but the detail button toggles (Add / Remove) and `onMultiChange` returns
// the full updated id array. Parent owns Continue — no auto-advance.

const mockMultiCards: PickerCard[] = [
  { id: "rune-ward", title: "Rune Ward", description: "Reduce incoming damage by 1d8." },
  { id: "unleash-chaos", title: "Unleash Chaos", description: "Channel raw energy." },
  { id: "wall-walk", title: "Wall Walk", description: "Climb walls and ceilings." },
];

describe("CardPicker (multi mode)", () => {
  it("shows 'Add {title}' button in detail when card is not yet selected", async () => {
    const user = userEvent.setup();
    render(
      <CardPicker
        cards={mockMultiCards}
        onSelect={vi.fn()}
        multi={{ count: 2 }}
        selectedIds={[]}
        onMultiChange={vi.fn()}
      />
    );

    await user.click(screen.getByText("Rune Ward"));
    expect(screen.getByRole("button", { name: /add rune ward/i })).toBeInTheDocument();
  });

  it("calls onMultiChange with [id] when Add is clicked on the first card", async () => {
    const user = userEvent.setup();
    const onMultiChange = vi.fn();
    render(
      <CardPicker
        cards={mockMultiCards}
        onSelect={vi.fn()}
        multi={{ count: 2 }}
        selectedIds={[]}
        onMultiChange={onMultiChange}
      />
    );

    await user.click(screen.getByText("Rune Ward"));
    await user.click(screen.getByRole("button", { name: /add rune ward/i }));

    expect(onMultiChange).toHaveBeenCalledWith(["rune-ward"]);
  });

  it("appends to selectedIds when a second card is added", async () => {
    const user = userEvent.setup();
    const onMultiChange = vi.fn();
    render(
      <CardPicker
        cards={mockMultiCards}
        onSelect={vi.fn()}
        multi={{ count: 2 }}
        selectedIds={["rune-ward"]}
        onMultiChange={onMultiChange}
      />
    );

    await user.click(screen.getByText("Unleash Chaos"));
    await user.click(screen.getByRole("button", { name: /add unleash chaos/i }));

    expect(onMultiChange).toHaveBeenCalledWith(["rune-ward", "unleash-chaos"]);
  });

  it("shows 'Remove {title}' button for already-selected cards and toggles off when clicked", async () => {
    const user = userEvent.setup();
    const onMultiChange = vi.fn();
    render(
      <CardPicker
        cards={mockMultiCards}
        onSelect={vi.fn()}
        multi={{ count: 2 }}
        selectedIds={["rune-ward"]}
        onMultiChange={onMultiChange}
      />
    );

    await user.click(screen.getByText("Rune Ward"));
    const removeBtn = screen.getByRole("button", { name: /remove rune ward/i });
    expect(removeBtn).toBeInTheDocument();

    await user.click(removeBtn);
    expect(onMultiChange).toHaveBeenCalledWith([]);
  });

  it("disables Add for unselected cards when at cap", async () => {
    const user = userEvent.setup();
    render(
      <CardPicker
        cards={mockMultiCards}
        onSelect={vi.fn()}
        multi={{ count: 2 }}
        selectedIds={["rune-ward", "unleash-chaos"]}
        onMultiChange={vi.fn()}
      />
    );

    // The unselected card (Wall Walk) has a disabled Add button
    await user.click(screen.getByText("Wall Walk"));
    expect(screen.getByRole("button", { name: /add wall walk/i })).toBeDisabled();
  });

  it("Remove stays enabled at cap so users can swap selections", async () => {
    const user = userEvent.setup();
    render(
      <CardPicker
        cards={mockMultiCards}
        onSelect={vi.fn()}
        multi={{ count: 2 }}
        selectedIds={["rune-ward", "unleash-chaos"]}
        onMultiChange={vi.fn()}
      />
    );

    await user.click(screen.getByText("Rune Ward"));
    expect(screen.getByRole("button", { name: /remove rune ward/i })).not.toBeDisabled();
  });

  it("never calls onSelect when in multi mode", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <CardPicker
        cards={mockMultiCards}
        onSelect={onSelect}
        multi={{ count: 2 }}
        selectedIds={[]}
        onMultiChange={vi.fn()}
      />
    );

    await user.click(screen.getByText("Rune Ward"));
    await user.click(screen.getByRole("button", { name: /add rune ward/i }));

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("marks selected cards with data-selected in the compact list", async () => {
    const user = userEvent.setup();
    render(
      <CardPicker
        cards={mockMultiCards}
        onSelect={vi.fn()}
        multi={{ count: 2 }}
        selectedIds={["rune-ward", "wall-walk"]}
        onMultiChange={vi.fn()}
      />
    );

    // Click a card to enter the master-detail layout
    await user.click(screen.getByText("Unleash Chaos"));

    const list = screen.getByTestId("card-picker-list");
    const runeWard = within(list).getByText("Rune Ward").closest("[data-card-id]");
    const wallWalk = within(list).getByText("Wall Walk").closest("[data-card-id]");
    const unleash = within(list).getByText("Unleash Chaos").closest("[data-card-id]");

    expect(runeWard).toHaveAttribute("data-selected", "true");
    expect(wallWalk).toHaveAttribute("data-selected", "true");
    expect(unleash).not.toHaveAttribute("data-selected");
  });

  it("marks selected cards with data-selected in the grid", () => {
    render(
      <CardPicker
        cards={mockMultiCards}
        onSelect={vi.fn()}
        multi={{ count: 2 }}
        selectedIds={["rune-ward"]}
        onMultiChange={vi.fn()}
      />
    );

    const runeWard = screen.getByText("Rune Ward").closest("[data-card-id]");
    const unleash = screen.getByText("Unleash Chaos").closest("[data-card-id]");

    expect(runeWard).toHaveAttribute("data-selected", "true");
    expect(unleash).not.toHaveAttribute("data-selected");
  });
});
