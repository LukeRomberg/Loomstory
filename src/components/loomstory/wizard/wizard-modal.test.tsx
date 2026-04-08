import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WizardModal } from "./wizard-modal";

describe("WizardModal", () => {
  it("renders children when open", () => {
    render(
      <WizardModal open onClose={vi.fn()}>
        <div>Wizard Content</div>
      </WizardModal>
    );
    expect(screen.getByText("Wizard Content")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <WizardModal open={false} onClose={vi.fn()}>
        <div>Wizard Content</div>
      </WizardModal>
    );
    expect(screen.queryByText("Wizard Content")).not.toBeInTheDocument();
  });

  it("renders close button", () => {
    render(
      <WizardModal open onClose={vi.fn()}>
        <div>Content</div>
      </WizardModal>
    );
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <WizardModal open onClose={onClose}>
        <div>Content</div>
      </WizardModal>
    );
    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when Escape is pressed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <WizardModal open onClose={onClose}>
        <div>Content</div>
      </WizardModal>
    );
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("renders title when provided", () => {
    render(
      <WizardModal open onClose={vi.fn()} title="Create Character">
        <div>Content</div>
      </WizardModal>
    );
    expect(screen.getByText("Create Character")).toBeInTheDocument();
  });
});
