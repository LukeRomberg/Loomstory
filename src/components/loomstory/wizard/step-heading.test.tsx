import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("does not render helpText inline (it lives in the popup now)", () => {
    render(<StepHeading title="Name" helpText="Some helpful info" />);
    expect(screen.queryByText("Some helpful info")).not.toBeInTheDocument();
  });

  it("renders the ? button only when helpText and onHelpClick are both provided", () => {
    const { rerender } = render(<StepHeading title="Name" helpText="Some info" />);
    expect(screen.queryByRole("button", { name: /show help/i })).not.toBeInTheDocument();

    rerender(<StepHeading title="Name" onHelpClick={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /show help/i })).not.toBeInTheDocument();

    rerender(<StepHeading title="Name" helpText="Some info" onHelpClick={vi.fn()} />);
    expect(screen.getByRole("button", { name: /show help/i })).toBeInTheDocument();
  });

  it("calls onHelpClick when the ? button is clicked", async () => {
    const user = userEvent.setup();
    const onHelpClick = vi.fn();
    render(<StepHeading title="Name" helpText="Some info" onHelpClick={onHelpClick} />);

    await user.click(screen.getByRole("button", { name: /show help/i }));
    expect(onHelpClick).toHaveBeenCalledOnce();
  });
});
