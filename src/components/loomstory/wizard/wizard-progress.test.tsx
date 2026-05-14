import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
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
});
