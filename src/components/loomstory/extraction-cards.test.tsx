import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  NpcCard,
  LocationCard,
  FactionCard,
  ItemCard,
  EventCard,
  ConversationCard,
} from "./extraction-cards";

const defaultHandlers = {
  onChange: vi.fn(),
  onToggle: vi.fn(),
};

describe("NpcCard", () => {
  const npc = {
    _accepted: true,
    name: "Gareth the Bold",
    aliases: ["Gareth"],
    description: "A tall warrior",
    status: "alive",
    tags: ["ally"],
    source_excerpt: "They met Gareth",
  };

  it("renders NPC name and description in collapsed view", () => {
    render(<NpcCard item={npc} index={0} {...defaultHandlers} />);
    expect(screen.getByText("Gareth the Bold")).toBeInTheDocument();
    expect(screen.getByText("A tall warrior")).toBeInTheDocument();
  });

  it("shows aliases as 'aka' text", () => {
    render(<NpcCard item={npc} index={0} {...defaultHandlers} />);
    expect(screen.getByText("aka Gareth")).toBeInTheDocument();
  });

  it("shows source excerpt", () => {
    render(<NpcCard item={npc} index={0} {...defaultHandlers} />);
    expect(screen.getByText(/They met Gareth/)).toBeInTheDocument();
  });

  it("calls onToggle when checkbox is clicked", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <NpcCard item={npc} index={2} onChange={vi.fn()} onToggle={onToggle} />
    );
    await user.click(screen.getByRole("checkbox"));
    expect(onToggle).toHaveBeenCalledWith(2);
  });

  it("shows edit button when accepted", () => {
    render(<NpcCard item={npc} index={0} {...defaultHandlers} />);
    // Pencil icon button exists
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("dims card when not accepted", () => {
    const rejected = { ...npc, _accepted: false };
    const { container } = render(
      <NpcCard item={rejected} index={0} {...defaultHandlers} />
    );
    const card = container.querySelector("[data-slot='card']");
    expect(card?.className).toContain("opacity-40");
  });
});

describe("LocationCard", () => {
  const location = {
    _accepted: true,
    name: "Ironhold",
    type: "city",
    description: "A fortified city",
  };

  it("renders location name and type badge", () => {
    render(<LocationCard item={location} index={0} {...defaultHandlers} />);
    expect(screen.getByText("Ironhold")).toBeInTheDocument();
    expect(screen.getByText("city")).toBeInTheDocument();
  });
});

describe("FactionCard", () => {
  const faction = {
    _accepted: true,
    name: "The Crimson Hand",
    description: "A shadowy guild",
  };

  it("renders faction name and description", () => {
    render(<FactionCard item={faction} index={0} {...defaultHandlers} />);
    expect(screen.getByText("The Crimson Hand")).toBeInTheDocument();
    expect(screen.getByText("A shadowy guild")).toBeInTheDocument();
  });
});

describe("ItemCard", () => {
  const item = {
    _accepted: true,
    name: "Flame Tongue",
    type: "weapon",
    description: "A magical sword that burns",
  };

  it("renders item name and type", () => {
    render(<ItemCard item={item} index={0} {...defaultHandlers} />);
    expect(screen.getByText("Flame Tongue")).toBeInTheDocument();
    expect(screen.getByText("weapon")).toBeInTheDocument();
  });
});

describe("EventCard", () => {
  const event = {
    _accepted: true,
    content: "The party defeated the dragon",
    summary: "Dragon defeated",
    event_type: "milestone",
    weight: 6,
    entity_tags: [
      { name: "Gareth", entity_id: "npc-1", entity_type: "npc", role: "subject" },
    ],
  };

  it("renders event type and weight badges", () => {
    render(<EventCard item={event} index={0} {...defaultHandlers} />);
    expect(screen.getByText("milestone")).toBeInTheDocument();
    expect(screen.getByText("w6")).toBeInTheDocument();
  });

  it("renders content text", () => {
    render(<EventCard item={event} index={0} {...defaultHandlers} />);
    expect(screen.getByText("The party defeated the dragon")).toBeInTheDocument();
  });

  it("shows entity tags in collapsed view", () => {
    render(<EventCard item={event} index={0} {...defaultHandlers} />);
    expect(screen.getByText(/Gareth/)).toBeInTheDocument();
    expect(screen.getByText(/subject/)).toBeInTheDocument();
  });
});

describe("ConversationCard", () => {
  const conversation = {
    _accepted: true,
    title: "Marta warns the party",
    summary: "Warning about bandits",
    turns: [
      { speaker: "Marta", text: "Be careful on the road.", tone: "nervous" },
      { speaker: "Gareth", text: "We can handle it.", tone: "confident" },
    ],
  };

  it("renders conversation title", () => {
    render(
      <ConversationCard
        item={conversation}
        index={0}
        {...defaultHandlers}
      />
    );
    expect(screen.getByText("Marta warns the party")).toBeInTheDocument();
  });

  it("shows dialogue preview in collapsed view", () => {
    render(
      <ConversationCard
        item={conversation}
        index={0}
        {...defaultHandlers}
      />
    );
    expect(screen.getByText(/Be careful on the road/)).toBeInTheDocument();
  });
});
