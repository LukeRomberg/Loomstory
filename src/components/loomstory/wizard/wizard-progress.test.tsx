import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WizardProgress } from "./wizard-progress";
import type { WizardProgressStep } from "./wizard-progress";

const steps: WizardProgressStep[] = [
  { key: "class_pick", label: "Class" },
  { key: "subclass_pick", label: "Subclass" },
  { key: "ancestry_pick", label: "Ancestry" },
  { key: "community_pick", label: "Community" },
  { key: "traits", label: "Traits" },
  { key: "review", label: "Review" },
];

describe("WizardProgress", () => {
  it("renders one label per step", () => {
    render(<WizardProgress steps={steps} currentStep="class_pick" />);
    expect(screen.getByText("Class")).toBeInTheDocument();
    expect(screen.getByText("Subclass")).toBeInTheDocument();
    expect(screen.getByText("Ancestry")).toBeInTheDocument();
    expect(screen.getByText("Community")).toBeInTheDocument();
    expect(screen.getByText("Traits")).toBeInTheDocument();
    expect(screen.getByText("Review")).toBeInTheDocument();
  });

  it("renders mobile step counter using the total step count", () => {
    render(<WizardProgress steps={steps} currentStep="class_pick" />);
    // Mobile shows "Step 1 / 6"
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText(/\/ 6/)).toBeInTheDocument();
  });

  it("advances step counter for later steps", () => {
    render(<WizardProgress steps={steps} currentStep="ancestry_pick" />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("handles a step in the middle", () => {
    render(<WizardProgress steps={steps} currentStep="subclass_pick" />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders a progress bar that scales with current step", () => {
    const { container } = render(
      <WizardProgress steps={steps} currentStep="ancestry_pick" />
    );
    const progressFill = container.querySelector("[data-testid='progress-fill']");
    expect(progressFill).toBeInTheDocument();
  });

  // ─── Click-to-jump behavior ──────────────────────────────────
  //
  // Players can click any *completed* step to jump back to it. Current and
  // future steps stay non-interactive — jumping forward could land on a step
  // whose required upstream state isn't satisfied yet, and jumping to the
  // current step is a no-op.

  it("calls onStepClick when a completed step label is clicked", async () => {
    const onStepClick = vi.fn();
    const user = userEvent.setup();
    render(
      <WizardProgress
        steps={steps}
        currentStep="ancestry_pick"
        onStepClick={onStepClick}
      />
    );

    // Class + Subclass are both completed (before ancestry_pick).
    await user.click(screen.getByText("Class"));
    expect(onStepClick).toHaveBeenCalledWith("class_pick");

    await user.click(screen.getByText("Subclass"));
    expect(onStepClick).toHaveBeenCalledWith("subclass_pick");
  });

  it("does NOT call onStepClick for the current step or future steps", async () => {
    const onStepClick = vi.fn();
    const user = userEvent.setup();
    render(
      <WizardProgress
        steps={steps}
        currentStep="ancestry_pick"
        onStepClick={onStepClick}
      />
    );

    // Current step
    await user.click(screen.getByText("Ancestry"));
    expect(onStepClick).not.toHaveBeenCalled();

    // Future steps
    await user.click(screen.getByText("Community"));
    await user.click(screen.getByText("Traits"));
    await user.click(screen.getByText("Review"));
    expect(onStepClick).not.toHaveBeenCalled();
  });

  it("is a no-op when onStepClick is not provided (backwards compat)", async () => {
    // Should not throw.
    const user = userEvent.setup();
    render(<WizardProgress steps={steps} currentStep="ancestry_pick" />);
    await user.click(screen.getByText("Class"));
  });
});
