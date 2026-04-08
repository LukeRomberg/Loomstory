import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WizardProgress } from "./wizard-progress";
import type { WizardPhase } from "./wizard-progress";

const phases: WizardPhase[] = [
  { label: "Name", steps: ["name"] },
  { label: "Class", steps: ["class_pick", "subclass_pick"] },
  { label: "Heritage", steps: ["ancestry"] },
  { label: "Traits", steps: ["traits"] },
  { label: "Create", steps: ["review"] },
];

describe("WizardProgress", () => {
  it("renders all phase labels", () => {
    render(<WizardProgress phases={phases} currentStep="name" />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Class")).toBeInTheDocument();
    expect(screen.getByText("Heritage")).toBeInTheDocument();
    expect(screen.getByText("Traits")).toBeInTheDocument();
    expect(screen.getByText("Create")).toBeInTheDocument();
  });

  it("renders mobile step counter", () => {
    render(<WizardProgress phases={phases} currentStep="name" />);
    // Mobile shows "Step 1 / 5"
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText(/\/ 5/)).toBeInTheDocument();
  });

  it("advances step counter for later steps", () => {
    render(<WizardProgress phases={phases} currentStep="ancestry" />);
    // ancestry is in phase index 2 → step 3 / 5
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders progress bar", () => {
    const { container } = render(<WizardProgress phases={phases} currentStep="ancestry" />);
    const progressBar = container.querySelector("[data-testid='progress-fill']");
    expect(progressBar).toBeInTheDocument();
  });

  it("handles step in second position of a multi-step phase", () => {
    render(<WizardProgress phases={phases} currentStep="subclass_pick" />);
    // subclass_pick is in phase "Class" (index 1) → step 2 / 5
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
