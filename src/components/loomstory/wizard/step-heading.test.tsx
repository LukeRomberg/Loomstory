import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StepHeading } from "./step-heading";

describe("StepHeading", () => {
  it("renders title in gold heading style", () => {
    render(<StepHeading title="Choose Your Class" />);
    const title = screen.getByText("Choose Your Class");
    expect(title).toBeInTheDocument();
    expect(title.tagName).toBe("H2");
  });

  it("renders subtitle when provided", () => {
    render(<StepHeading title="Name" subtitle="Give your hero a name." />);
    expect(screen.getByText("Give your hero a name.")).toBeInTheDocument();
  });

  it("does not render subtitle when not provided", () => {
    const { container } = render(<StepHeading title="Name" />);
    expect(container.querySelectorAll("p")).toHaveLength(0);
  });

  it("renders helpText whenever provided (no toggle)", () => {
    render(<StepHeading title="Name" helpText="This is helpful" />);
    expect(screen.getByText("This is helpful")).toBeInTheDocument();
  });

  it("does not render any help toggle button", () => {
    render(<StepHeading title="Name" helpText="This is helpful" />);
    // The "?" toggle was removed — helpText is always visible
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("does not render helpText when not provided", () => {
    render(<StepHeading title="Name" subtitle="A subtitle" />);
    expect(screen.queryByText(/help/i)).not.toBeInTheDocument();
  });
});
