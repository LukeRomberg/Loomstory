import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExperienceInput } from "./experience-input";

const sampleSuggestions = [
  {
    label: "Backgrounds",
    items: ["Assassin", "Blacksmith", "High Priestess"],
  },
  {
    label: "Characteristics",
    items: ["Affable", "Bookworm", "Sticky Fingers"],
  },
  {
    label: "Phrases",
    items: ["Catch Me If You Can", "I've Got Your Back"],
  },
];

describe("ExperienceInput", () => {
  it("renders the configured number of text inputs", () => {
    render(
      <ExperienceInput
        count={2}
        experiences={[{ name: "" }, { name: "" }]}
        suggestions={sampleSuggestions}
        onChange={vi.fn()}
      />
    );

    expect(screen.getAllByRole("textbox")).toHaveLength(2);
  });

  it("renders each suggestion category as a labeled section with all chips", () => {
    render(
      <ExperienceInput
        count={2}
        experiences={[{ name: "" }, { name: "" }]}
        suggestions={sampleSuggestions}
        onChange={vi.fn()}
      />
    );

    // Each category label is rendered
    expect(screen.getByText("Backgrounds")).toBeInTheDocument();
    expect(screen.getByText("Characteristics")).toBeInTheDocument();
    expect(screen.getByText("Phrases")).toBeInTheDocument();

    // Every chip in each category renders as a button
    expect(screen.getByRole("button", { name: "Assassin" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "High Priestess" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sticky Fingers" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Catch Me If You Can" })
    ).toBeInTheDocument();
  });

  it("clicking a chip populates the first empty input when none is focused", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ExperienceInput
        count={2}
        experiences={[{ name: "" }, { name: "" }]}
        suggestions={sampleSuggestions}
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "Assassin" }));

    expect(onChange).toHaveBeenCalledWith([
      { name: "Assassin" },
      { name: "" },
    ]);
  });

  it("clicking a chip populates the most-recently-focused input", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ExperienceInput
        count={2}
        experiences={[{ name: "Existing" }, { name: "" }]}
        suggestions={sampleSuggestions}
        onChange={onChange}
      />
    );

    // Focus the second input, then click a chip
    const inputs = screen.getAllByRole("textbox");
    await user.click(inputs[1]);
    await user.click(screen.getByRole("button", { name: "Bookworm" }));

    expect(onChange).toHaveBeenCalledWith([
      { name: "Existing" },
      { name: "Bookworm" },
    ]);
  });

  it("clicking a chip when both inputs are filled and none focused overwrites the first", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ExperienceInput
        count={2}
        experiences={[{ name: "Foo" }, { name: "Bar" }]}
        suggestions={sampleSuggestions}
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "Assassin" }));

    expect(onChange).toHaveBeenCalledWith([
      { name: "Assassin" },
      { name: "Bar" },
    ]);
  });

  it("typing in an input calls onChange with the updated array", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ExperienceInput
        count={2}
        experiences={[{ name: "" }, { name: "" }]}
        suggestions={sampleSuggestions}
        onChange={onChange}
      />
    );

    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "A");

    expect(onChange).toHaveBeenLastCalledWith([
      { name: "A" },
      { name: "" },
    ]);
  });

  it("renders an experience modifier badge (+2) next to each input", () => {
    render(
      <ExperienceInput
        count={2}
        modifier={2}
        experiences={[{ name: "" }, { name: "" }]}
        suggestions={sampleSuggestions}
        onChange={vi.fn()}
      />
    );

    // Both inputs should be paired with a "+2" indicator
    expect(screen.getAllByText("+2")).toHaveLength(2);
  });

  it("scopes each chip to its category section in the DOM", () => {
    render(
      <ExperienceInput
        count={2}
        experiences={[{ name: "" }, { name: "" }]}
        suggestions={sampleSuggestions}
        onChange={vi.fn()}
      />
    );

    // Each category section is testable in isolation; chips live under their category.
    const backgrounds = screen.getByTestId("experience-suggestions-Backgrounds");
    expect(within(backgrounds).getByRole("button", { name: "Assassin" })).toBeInTheDocument();
    expect(within(backgrounds).queryByRole("button", { name: "Bookworm" })).toBeNull();

    const characteristics = screen.getByTestId(
      "experience-suggestions-Characteristics"
    );
    expect(
      within(characteristics).getByRole("button", { name: "Bookworm" })
    ).toBeInTheDocument();
  });
});
