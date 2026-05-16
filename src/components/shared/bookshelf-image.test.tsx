import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookshelfImage } from "./bookshelf-image";

describe("BookshelfImage", () => {
  it("renders a hotspot for every section", () => {
    render(
      <BookshelfImage
        sections={[
          { slug: "npcs", onClick: vi.fn() },
          { slug: "locations", onClick: vi.fn() },
          { slug: "factions", onClick: vi.fn() },
          { slug: "events", onClick: vi.fn() },
          { slug: "conversations", onClick: vi.fn() },
          { slug: "plot-threads", onClick: vi.fn() },
          { slug: "items", onClick: vi.fn() },
          { slug: "lore", onClick: vi.fn() },
          { slug: "characters", onClick: vi.fn() },
        ]}
      />
    );
    expect(screen.getByLabelText("NPCs")).toBeInTheDocument();
    expect(screen.getByLabelText("Locations")).toBeInTheDocument();
    expect(screen.getByLabelText("Lore")).toBeInTheDocument();
    expect(screen.getByLabelText("Characters")).toBeInTheDocument();
    expect(screen.getAllByTestId("bookshelf-hotspot")).toHaveLength(9);
  });

  it("calls onClick when a hotspot is clicked", async () => {
    const user = userEvent.setup();
    const onNpcClick = vi.fn();
    render(
      <BookshelfImage
        sections={[
          { slug: "npcs", onClick: onNpcClick },
          { slug: "lore", onClick: vi.fn() },
        ]}
      />
    );
    await user.click(screen.getByLabelText("NPCs"));
    expect(onNpcClick).toHaveBeenCalledOnce();
  });

  it("renders a Link when section has href", () => {
    render(
      <BookshelfImage
        sections={[{ slug: "npcs", href: "/campaign/abc/npcs" }]}
      />
    );
    const link = screen.getByLabelText("NPCs");
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/campaign/abc/npcs");
  });

  it("only renders hotspots for sections actually provided", () => {
    render(
      <BookshelfImage
        sections={[{ slug: "npcs", onClick: vi.fn() }]}
      />
    );
    expect(screen.getAllByTestId("bookshelf-hotspot")).toHaveLength(1);
    expect(screen.queryByLabelText("Locations")).not.toBeInTheDocument();
  });
});
