import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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
