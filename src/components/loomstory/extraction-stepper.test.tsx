import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExtractionStepper } from "./extraction-stepper";

const steps = [
  { key: "npcs", label: "NPCs", count: 3 },
  { key: "locations", label: "Locations", count: 1 },
  { key: "events", label: "Events", count: 5 },
  { key: "commit", label: "Commit", count: 0 },
];

describe("ExtractionStepper", () => {
  it("renders all steps", () => {
    render(
      <ExtractionStepper steps={steps} currentStep={0} onStepClick={vi.fn()} />
    );
    expect(screen.getByText("NPCs")).toBeInTheDocument();
    expect(screen.getByText("Locations")).toBeInTheDocument();
    expect(screen.getByText("Events")).toBeInTheDocument();
    expect(screen.getByText("Commit")).toBeInTheDocument();
  });

  it("shows counts for non-zero steps", () => {
    render(
      <ExtractionStepper steps={steps} currentStep={0} onStepClick={vi.fn()} />
    );
    expect(screen.getByText("(3)")).toBeInTheDocument();
    expect(screen.getByText("(1)")).toBeInTheDocument();
    expect(screen.getByText("(5)")).toBeInTheDocument();
  });

  it("calls onStepClick when a step is clicked", async () => {
    const user = userEvent.setup();
    const onStepClick = vi.fn();
    render(
      <ExtractionStepper
        steps={steps}
        currentStep={0}
        onStepClick={onStepClick}
      />
    );

    await user.click(screen.getByText("Locations"));
    expect(onStepClick).toHaveBeenCalledWith(1);
  });

  it("highlights the current step", () => {
    render(
      <ExtractionStepper steps={steps} currentStep={1} onStepClick={vi.fn()} />
    );
    const locationsButton = screen.getByText("Locations").closest("button");
    expect(locationsButton?.className).toContain("text-gold");
  });
});
