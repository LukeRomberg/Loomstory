import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";

describe("ConfirmDeleteDialog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders dialog title with entity name", () => {
    render(
      <ConfirmDeleteDialog
        entityName="Gareth the Bold"
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByText(/delete.*gareth the bold/i)).toBeInTheDocument();
  });

  it("renders archive description", () => {
    render(
      <ConfirmDeleteDialog
        entityName="Test"
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByText(/archive/i)).toBeInTheDocument();
    expect(screen.getByText(/preserved/i)).toBeInTheDocument();
  });

  it("renders cancel and delete buttons", () => {
    render(
      <ConfirmDeleteDialog
        entityName="Test"
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByText(/cancel/i)).toBeInTheDocument();
    const deleteBtn = screen.getAllByRole("button").find(
      (b) => b.textContent?.toLowerCase().includes("delete")
    );
    expect(deleteBtn).toBeTruthy();
  });

  it("calls onConfirm when delete is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ConfirmDeleteDialog
        entityName="Test"
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
      />
    );
    const deleteBtn = screen.getAllByRole("button").find(
      (b) => b.textContent?.toLowerCase().includes("delete")
    );
    if (deleteBtn) await user.click(deleteBtn);
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("shows loading state when deleting", () => {
    render(
      <ConfirmDeleteDialog
        entityName="Test"
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        deleting={true}
      />
    );
    expect(screen.getByText(/deleting/i)).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    render(
      <ConfirmDeleteDialog
        entityName="Test"
        open={false}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.queryByText(/delete/i)).not.toBeInTheDocument();
  });
});
