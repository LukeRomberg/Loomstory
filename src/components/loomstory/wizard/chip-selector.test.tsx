import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChipSelector } from "./chip-selector";
import type { ChipOption } from "./chip-selector";

const skills: ChipOption[] = [
  { id: "athletics", label: "Athletics" },
  { id: "acrobatics", label: "Acrobatics" },
  { id: "perception", label: "Perception" },
  { id: "stealth", label: "Stealth" },
  { id: "insight", label: "Insight" },
];

describe("ChipSelector", () => {
  it("renders all options as chips", () => {
    render(<ChipSelector options={skills} selected={[]} onChange={vi.fn()} />);
    expect(screen.getByText("Athletics")).toBeInTheDocument();
    expect(screen.getByText("Stealth")).toBeInTheDocument();
  });

  it("highlights selected chips", () => {
    render(<ChipSelector options={skills} selected={["athletics"]} onChange={vi.fn()} />);
    const chip = screen.getByText("Athletics").closest("button");
    expect(chip?.className).toContain("border-gold");
  });

  it("calls onChange with added id when unselected chip is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ChipSelector options={skills} selected={["athletics"]} onChange={onChange} />);

    await user.click(screen.getByText("Perception"));
    expect(onChange).toHaveBeenCalledWith(["athletics", "perception"]);
  });

  it("calls onChange with removed id when selected chip is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ChipSelector options={skills} selected={["athletics", "perception"]} onChange={onChange} />);

    await user.click(screen.getByText("Athletics"));
    expect(onChange).toHaveBeenCalledWith(["perception"]);
  });

  it("disables unselected chips when max is reached", () => {
    render(<ChipSelector options={skills} selected={["athletics", "perception"]} onChange={vi.fn()} max={2} />);

    const stealth = screen.getByText("Stealth").closest("button");
    expect(stealth).toBeDisabled();

    // Selected chips should still be enabled (to deselect)
    const athletics = screen.getByText("Athletics").closest("button");
    expect(athletics).not.toBeDisabled();
  });

  it("renders locked chips as visually distinct and non-interactive", () => {
    const optionsWithLocked: ChipOption[] = [
      { id: "nature", label: "Nature", locked: true },
      ...skills,
    ];
    render(<ChipSelector options={optionsWithLocked} selected={["nature"]} onChange={vi.fn()} />);

    const nature = screen.getByText("Nature").closest("button");
    expect(nature).toBeDisabled();
    expect(nature?.className).toContain("border-gold");
  });

  it("shows counter when max is provided", () => {
    render(<ChipSelector options={skills} selected={["athletics"]} onChange={vi.fn()} max={2} />);
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  it("renders chip descriptions when provided", () => {
    const optionsWithDesc: ChipOption[] = [
      { id: "athletics", label: "Athletics", description: "Feats of strength" },
    ];
    render(<ChipSelector options={optionsWithDesc} selected={[]} onChange={vi.fn()} />);
    expect(screen.getByText("Feats of strength")).toBeInTheDocument();
  });

  it("works in single-select mode", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ChipSelector options={skills} selected={["athletics"]} onChange={onChange} max={1} />);

    // Clicking a different chip should replace the selection
    await user.click(screen.getByText("Perception"));
    expect(onChange).toHaveBeenCalledWith(["perception"]);
  });
});
