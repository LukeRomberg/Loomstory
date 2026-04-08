import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WizardFooter } from "./wizard-footer";

describe("WizardFooter", () => {
  it("renders continue button with default label", () => {
    render(<WizardFooter onContinue={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
  });

  it("renders custom label", () => {
    render(<WizardFooter onContinue={vi.fn()} label="Create Character" />);
    expect(screen.getByRole("button", { name: "Create Character" })).toBeInTheDocument();
  });

  it("calls onContinue when clicked", async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    render(<WizardFooter onContinue={onContinue} />);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it("disables button when disabled prop is true", () => {
    render(<WizardFooter onContinue={vi.fn()} disabled />);
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("shows loading state", () => {
    render(<WizardFooter onContinue={vi.fn()} loading loadingLabel="Creating..." />);
    expect(screen.getByRole("button", { name: "Creating..." })).toBeDisabled();
  });

  it("renders skip link when onSkip is provided", () => {
    render(<WizardFooter onContinue={vi.fn()} onSkip={vi.fn()} skipLabel="Skip for now" />);
    expect(screen.getByText("Skip for now")).toBeInTheDocument();
  });

  it("calls onSkip when skip link is clicked", async () => {
    const user = userEvent.setup();
    const onSkip = vi.fn();
    render(<WizardFooter onContinue={vi.fn()} onSkip={onSkip} skipLabel="Skip" />);
    await user.click(screen.getByText("Skip"));
    expect(onSkip).toHaveBeenCalledOnce();
  });

  it("does not render skip link when onSkip is not provided", () => {
    render(<WizardFooter onContinue={vi.fn()} />);
    expect(screen.queryByText(/skip/i)).not.toBeInTheDocument();
  });
});
