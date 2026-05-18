import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmblemPicker } from "./emblem-picker";

const ICONS = [
  "game-icons:wolf-head",
  "game-icons:castle",
  "game-icons:dragon-spiral",
  "game-icons:spell-book",
  "game-icons:crossed-swords",
];

describe("EmblemPicker", () => {
  it("renders a search input", () => {
    render(
      <EmblemPicker
        availableEmblems={ICONS}
        value={null}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it("renders a clickable option for each icon", () => {
    render(
      <EmblemPicker
        availableEmblems={ICONS}
        value={null}
        onChange={vi.fn()}
      />
    );
    expect(screen.getAllByTestId("emblem-option")).toHaveLength(ICONS.length);
  });

  it("calls onChange with the icon name when an unselected option is clicked", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <EmblemPicker
        availableEmblems={ICONS}
        value={null}
        onChange={onChange}
      />
    );
    await user.click(screen.getByRole("button", { name: /wolf-head/i }));
    expect(onChange).toHaveBeenCalledWith("game-icons:wolf-head");
  });

  it("calls onChange(null) when the currently selected option is clicked again", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <EmblemPicker
        availableEmblems={ICONS}
        value="game-icons:castle"
        onChange={onChange}
      />
    );
    await user.click(screen.getByRole("button", { name: /castle/i }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("marks the selected option with aria-pressed=true", () => {
    render(
      <EmblemPicker
        availableEmblems={ICONS}
        value="game-icons:dragon-spiral"
        onChange={vi.fn()}
      />
    );
    const selected = screen.getByRole("button", { name: /dragon-spiral/i });
    expect(selected).toHaveAttribute("aria-pressed", "true");
    const unselected = screen.getByRole("button", { name: /castle/i });
    expect(unselected).toHaveAttribute("aria-pressed", "false");
  });

  it("filters the grid live as the user types", async () => {
    const user = userEvent.setup();
    render(
      <EmblemPicker
        availableEmblems={ICONS}
        value={null}
        onChange={vi.fn()}
      />
    );
    await user.type(screen.getByPlaceholderText(/search/i), "dragon");
    expect(screen.getAllByTestId("emblem-option")).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: /dragon-spiral/i })
    ).toBeInTheDocument();
  });

  it("shows a no-results message when nothing matches the search", async () => {
    const user = userEvent.setup();
    render(
      <EmblemPicker
        availableEmblems={ICONS}
        value={null}
        onChange={vi.fn()}
      />
    );
    await user.type(screen.getByPlaceholderText(/search/i), "zzzzzz");
    expect(screen.getByText(/no emblems/i)).toBeInTheDocument();
  });

  it("renders a loading state when loading is true", () => {
    render(
      <EmblemPicker
        availableEmblems={[]}
        value={null}
        onChange={vi.fn()}
        loading
      />
    );
    expect(screen.getByTestId("emblem-picker-loading")).toBeInTheDocument();
  });
});
