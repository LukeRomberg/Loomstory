import { describe, it, expect } from "vitest";
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
    render(
      <StepHeading title="Name" subtitle="Give your hero a name." />
    );
    expect(screen.getByText("Give your hero a name.")).toBeInTheDocument();
  });

  it("does not render subtitle when not provided", () => {
    const { container } = render(<StepHeading title="Name" />);
    expect(container.querySelectorAll("p")).toHaveLength(0);
  });

  it("renders help toggle button when helpText is provided", () => {
    render(<StepHeading title="Name" helpText="Some helpful info" />);
    expect(screen.getByRole("button", { name: /show help/i })).toBeInTheDocument();
  });

  it("does not render help toggle when helpText is not provided", () => {
    render(<StepHeading title="Name" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows help text when help button is clicked", async () => {
    const user = userEvent.setup();
    render(<StepHeading title="Name" helpText="This is helpful" />);

    expect(screen.queryByText("This is helpful")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /show help/i }));
    expect(screen.getByText("This is helpful")).toBeInTheDocument();
  });

  it("hides help text when help button is clicked again", async () => {
    const user = userEvent.setup();
    render(<StepHeading title="Name" helpText="This is helpful" />);

    await user.click(screen.getByRole("button", { name: /show help/i }));
    expect(screen.getByText("This is helpful")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /hide help/i }));
    expect(screen.queryByText("This is helpful")).not.toBeInTheDocument();
  });
});
