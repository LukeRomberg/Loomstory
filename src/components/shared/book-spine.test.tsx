import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookOpen, Users } from "lucide-react";
import { BookSpine } from "./book-spine";

describe("BookSpine", () => {
  it("renders the title", () => {
    render(
      <BookSpine
        title="Lore"
        color="mahogany"
        emblem={BookOpen}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByText("Lore")).toBeInTheDocument();
  });

  it("renders the subtitle when provided", () => {
    render(
      <BookSpine
        title="NPCs"
        subtitle="24 entries"
        color="deep-brown"
        emblem={Users}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByText("24 entries")).toBeInTheDocument();
  });

  it("does not render subtitle markup when not provided", () => {
    render(
      <BookSpine
        title="NPCs"
        color="deep-brown"
        emblem={Users}
        onClick={vi.fn()}
      />
    );
    expect(screen.queryByTestId("book-subtitle")).not.toBeInTheDocument();
  });

  it("renders the emblem icon", () => {
    render(
      <BookSpine
        title="Lore"
        color="mahogany"
        emblem={BookOpen}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByTestId("book-emblem")).toBeInTheDocument();
  });

  it.each([
    ["mahogany", "bg-void"],
    ["deep-brown", "bg-leather"],
    ["ink-blue", "bg-ink-blue"],
    ["forest", "bg-forest"],
  ])("applies the %s color variant class", (color, expectedClass) => {
    render(
      <BookSpine
        title="Test"
        color={color as "mahogany" | "deep-brown" | "ink-blue" | "forest"}
        emblem={BookOpen}
        onClick={vi.fn()}
      />
    );
    const spine = screen.getByTestId("book-spine");
    expect(spine.className).toContain(expectedClass);
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <BookSpine
        title="Lore"
        color="mahogany"
        emblem={BookOpen}
        onClick={onClick}
      />
    );
    await user.click(screen.getByTestId("book-spine"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders as a link when href is provided", () => {
    render(
      <BookSpine
        title="Lore"
        color="mahogany"
        emblem={BookOpen}
        href="/campaign/abc/lore"
      />
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/campaign/abc/lore");
    expect(link).toHaveTextContent("Lore");
  });

  it("shows a GM-only indicator when gmOnly is true", () => {
    render(
      <BookSpine
        title="Secrets"
        color="forest"
        emblem={BookOpen}
        gmOnly
        onClick={vi.fn()}
      />
    );
    expect(screen.getByTestId("book-gm-only")).toBeInTheDocument();
  });

  it("does not show GM-only indicator when gmOnly is false or unset", () => {
    render(
      <BookSpine
        title="Public"
        color="mahogany"
        emblem={BookOpen}
        onClick={vi.fn()}
      />
    );
    expect(screen.queryByTestId("book-gm-only")).not.toBeInTheDocument();
  });

  it("applies embossed-gold class to the title", () => {
    render(
      <BookSpine
        title="Lore"
        color="mahogany"
        emblem={BookOpen}
        onClick={vi.fn()}
      />
    );
    const title = screen.getByText("Lore");
    expect(title.className).toContain("embossed-gold");
  });
});
