import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EntityCard } from "./entity-card";

describe("EntityCard", () => {
  it("renders the entity name", () => {
    render(<EntityCard name="Gareth the Bold" onClick={vi.fn()} />);
    expect(screen.getByText("Gareth the Bold")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<EntityCard name="Gareth" description="A tall warrior" onClick={vi.fn()} />);
    expect(screen.getByText("A tall warrior")).toBeInTheDocument();
  });

  it("renders badges when provided", () => {
    render(
      <EntityCard
        name="Gareth"
        badges={[
          { label: "alive", variant: "outline" },
          { label: "ally", variant: "secondary" },
        ]}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByText("alive")).toBeInTheDocument();
    expect(screen.getByText("ally")).toBeInTheDocument();
  });

  it("shows gm_only badge when gmOnly is true", () => {
    render(<EntityCard name="Secret NPC" gmOnly={true} onClick={vi.fn()} />);
    expect(screen.getByText(/gm only/i)).toBeInTheDocument();
  });

  it("does not show gm_only badge when gmOnly is false", () => {
    render(<EntityCard name="Public NPC" gmOnly={false} onClick={vi.fn()} />);
    expect(screen.queryByText(/gm only/i)).not.toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<EntityCard name="Gareth" onClick={onClick} />);
    await user.click(screen.getByText("Gareth"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("applies grain and gold-glow classes", () => {
    const { container } = render(<EntityCard name="Test" onClick={vi.fn()} />);
    const card = container.querySelector("[data-slot='card']");
    expect(card?.className).toContain("grain");
    expect(card?.className).toContain("gold-glow");
  });

  it("truncates long descriptions to 2 lines", () => {
    render(
      <EntityCard
        name="Test"
        description="A very long description that should be truncated"
        onClick={vi.fn()}
      />
    );
    const desc = screen.getByText(/very long description/);
    expect(desc.className).toContain("line-clamp-2");
  });
});
