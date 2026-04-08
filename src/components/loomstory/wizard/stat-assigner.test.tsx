import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StatAssigner } from "./stat-assigner";
import type { StatSlot } from "./stat-assigner";

const daggerheartSlots: StatSlot[] = [
  { key: "agility", label: "Agility", group: "Agility / Strength" },
  { key: "strength", label: "Strength", group: "Agility / Strength" },
  { key: "finesse", label: "Finesse", group: "Finesse / Instinct" },
  { key: "instinct", label: "Instinct", group: "Finesse / Instinct" },
  { key: "presence", label: "Presence", group: "Presence / Knowledge" },
  { key: "knowledge", label: "Knowledge", group: "Presence / Knowledge" },
];

const standardArray = [3, 2, 1, 1, 0, -1];

describe("StatAssigner", () => {
  it("renders all stat slot labels", () => {
    render(
      <StatAssigner
        slots={daggerheartSlots}
        standardArray={standardArray}
        values={{}}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText("Agility")).toBeInTheDocument();
    expect(screen.getByText("Strength")).toBeInTheDocument();
    expect(screen.getByText("Knowledge")).toBeInTheDocument();
  });

  it("renders group labels", () => {
    render(
      <StatAssigner
        slots={daggerheartSlots}
        standardArray={standardArray}
        values={{}}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText("Agility / Strength")).toBeInTheDocument();
    expect(screen.getByText("Finesse / Instinct")).toBeInTheDocument();
  });

  it("shows available values in dropdown selectors", async () => {
    const user = userEvent.setup();
    render(
      <StatAssigner
        slots={daggerheartSlots}
        standardArray={standardArray}
        values={{}}
        onChange={vi.fn()}
      />
    );

    // Each stat should have a select element
    const selects = screen.getAllByRole("combobox");
    expect(selects).toHaveLength(6);
  });

  it("calls onChange when a value is assigned", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <StatAssigner
        slots={daggerheartSlots}
        standardArray={standardArray}
        values={{}}
        onChange={onChange}
      />
    );

    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[0], "3");
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ agility: 3 }));
  });

  it("removes assigned value from available pool for other selects", async () => {
    const user = userEvent.setup();
    render(
      <StatAssigner
        slots={daggerheartSlots}
        standardArray={standardArray}
        values={{ agility: 3 }}
        onChange={vi.fn()}
      />
    );

    // The second select should not have 3 as an option (only one 3 in the array)
    const selects = screen.getAllByRole("combobox");
    const options = Array.from(selects[1].querySelectorAll("option"));
    const values = options.map((o) => o.value).filter((v) => v !== "");
    // 3 is taken by agility, so strength should not have it
    expect(values).not.toContain("3");
  });

  it("renders mark checkboxes when markCount is provided", () => {
    render(
      <StatAssigner
        slots={daggerheartSlots}
        standardArray={standardArray}
        values={{}}
        onChange={vi.fn()}
        markCount={2}
        markedKeys={[]}
        onMarkedChange={vi.fn()}
      />
    );

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(6);
  });

  it("calls onMarkedChange when a mark checkbox is toggled", async () => {
    const user = userEvent.setup();
    const onMarkedChange = vi.fn();
    render(
      <StatAssigner
        slots={daggerheartSlots}
        standardArray={standardArray}
        values={{}}
        onChange={vi.fn()}
        markCount={2}
        markedKeys={[]}
        onMarkedChange={onMarkedChange}
      />
    );

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);
    expect(onMarkedChange).toHaveBeenCalledWith(["agility"]);
  });

  it("disables unchecked mark checkboxes when markCount is reached", () => {
    render(
      <StatAssigner
        slots={daggerheartSlots}
        standardArray={standardArray}
        values={{}}
        onChange={vi.fn()}
        markCount={2}
        markedKeys={["agility", "finesse"]}
        onMarkedChange={vi.fn()}
      />
    );

    const checkboxes = screen.getAllByRole("checkbox");
    // agility and finesse should be checked, the rest disabled
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[2]).toBeChecked();
    expect(checkboxes[1]).toBeDisabled(); // strength
    expect(checkboxes[3]).toBeDisabled(); // instinct
  });

  it("does not render mark checkboxes when markCount is not provided", () => {
    render(
      <StatAssigner
        slots={daggerheartSlots}
        standardArray={standardArray}
        values={{}}
        onChange={vi.fn()}
      />
    );

    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });

  it("shows mark counter when markCount is provided", () => {
    render(
      <StatAssigner
        slots={daggerheartSlots}
        standardArray={standardArray}
        values={{}}
        onChange={vi.fn()}
        markCount={2}
        markedKeys={["agility"]}
        onMarkedChange={vi.fn()}
      />
    );

    expect(screen.getByText("1 / 2 marked")).toBeInTheDocument();
  });
});
