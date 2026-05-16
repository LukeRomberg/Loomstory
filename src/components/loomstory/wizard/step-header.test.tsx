import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StepHeader } from "./step-header";

describe("StepHeader", () => {
  it("renders the title", () => {
    render(<StepHeader title="Choose Your Class" />);
    expect(screen.getByText("Choose Your Class")).toBeInTheDocument();
  });

  it("renders the Back button when onBack is provided", async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();
    render(<StepHeader title="Subclass" onBack={onBack} />);
    await user.click(screen.getByRole("button", { name: /back/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("hides the Back button when onBack is omitted (e.g. on the first step)", () => {
    render(<StepHeader title="Class" />);
    expect(screen.queryByRole("button", { name: /back/i })).not.toBeInTheDocument();
  });

  it("renders center children (e.g. an inline toggle) between Back and Title", () => {
    render(
      <StepHeader title="Ancestry" onBack={vi.fn()}>
        <div data-testid="center-slot">Female / Male</div>
      </StepHeader>
    );
    expect(screen.getByTestId("center-slot")).toBeInTheDocument();
  });

  it("renders Back, center children, and title in a single row container", () => {
    const { container } = render(
      <StepHeader title="Ancestry" onBack={vi.fn()}>
        <div data-testid="center-slot">M/F</div>
      </StepHeader>
    );
    // All three pieces live inside the same flex row — this is the whole point
    // of the refactor (vs. stacked back + heading + controls vertically).
    const root = container.firstChild as HTMLElement;
    expect(root.className).toMatch(/\bflex\b/);
    expect(within(root).getByRole("button", { name: /back/i })).toBeInTheDocument();
    expect(within(root).getByTestId("center-slot")).toBeInTheDocument();
    expect(within(root).getByText("Ancestry")).toBeInTheDocument();
  });
});
