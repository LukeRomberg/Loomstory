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

// Daggerheart SRD 9-09-25, page 4 step 3: +2, +1, +1, +0, +0, -1
const standardArray = [2, 1, 1, 0, 0, -1];

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

  it("shows available values in dropdown selectors", () => {
    render(
      <StatAssigner
        slots={daggerheartSlots}
        standardArray={standardArray}
        values={{}}
        onChange={vi.fn()}
      />
    );

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
    await user.selectOptions(selects[0], "2");
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ agility: 2 }));
  });

  it("removes assigned value from available pool for other selects", () => {
    render(
      <StatAssigner
        slots={daggerheartSlots}
        standardArray={standardArray}
        values={{ agility: 2 }}
        onChange={vi.fn()}
      />
    );

    // The second select should not have 2 as an option (only one +2 in the array)
    const selects = screen.getAllByRole("combobox");
    const options = Array.from(selects[1].querySelectorAll("option"));
    const values = options.map((o) => o.value).filter((v) => v !== "");
    // +2 is taken by agility, so strength should not have it
    expect(values).not.toContain("2");
  });

  it("does not render mark checkboxes (the 'mark for advantage' mechanic is not in the SRD)", () => {
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
});
