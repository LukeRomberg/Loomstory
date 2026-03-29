import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EntityFormTemplate } from "./entity-form-template";

describe("EntityFormTemplate — Create Mode", () => {
  const onSubmit = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it("shows 'Create [entityType]' as submit button text", () => {
    render(
      <EntityFormTemplate
        mode="create"
        entityType="NPC"
        onSubmit={onSubmit}
        onCancel={onCancel}
        saving={false}
      >
        <input />
      </EntityFormTemplate>
    );
    // Both card title and button say "Create NPC" — find the button specifically
    const submitBtn = screen.getAllByText(/create npc/i).find(
      (el) => el.closest("button")
    );
    expect(submitBtn).toBeTruthy();
  });

  it("does not show delete button in create mode", () => {
    render(
      <EntityFormTemplate
        mode="create"
        entityType="NPC"
        onSubmit={onSubmit}
        onCancel={onCancel}
        saving={false}
      >
        <input />
      </EntityFormTemplate>
    );
    expect(screen.queryByText(/delete/i)).not.toBeInTheDocument();
  });

  it("shows cancel button", () => {
    render(
      <EntityFormTemplate
        mode="create"
        entityType="NPC"
        onSubmit={onSubmit}
        onCancel={onCancel}
        saving={false}
      >
        <input />
      </EntityFormTemplate>
    );
    expect(screen.getByText(/cancel/i)).toBeInTheDocument();
  });

  it("calls onSubmit when form is submitted", async () => {
    const user = userEvent.setup();
    render(
      <EntityFormTemplate
        mode="create"
        entityType="NPC"
        onSubmit={onSubmit}
        onCancel={onCancel}
        saving={false}
      >
        <input />
      </EntityFormTemplate>
    );
    const submitBtn = screen.getAllByText(/create npc/i).find(
      (el) => el.closest("button")
    );
    if (submitBtn) await user.click(submitBtn);
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("calls onCancel when cancel is clicked", async () => {
    const user = userEvent.setup();
    render(
      <EntityFormTemplate
        mode="create"
        entityType="NPC"
        onSubmit={onSubmit}
        onCancel={onCancel}
        saving={false}
      >
        <input />
      </EntityFormTemplate>
    );
    await user.click(screen.getByText(/cancel/i));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("shows saving state on submit button", () => {
    render(
      <EntityFormTemplate
        mode="create"
        entityType="NPC"
        onSubmit={onSubmit}
        onCancel={onCancel}
        saving={true}
      >
        <input />
      </EntityFormTemplate>
    );
    expect(screen.getByText(/creating/i)).toBeInTheDocument();
  });

  it("renders children as form content", () => {
    render(
      <EntityFormTemplate
        mode="create"
        entityType="NPC"
        onSubmit={onSubmit}
        onCancel={onCancel}
        saving={false}
      >
        <input placeholder="NPC Name" />
      </EntityFormTemplate>
    );
    expect(screen.getByPlaceholderText("NPC Name")).toBeInTheDocument();
  });
});

describe("EntityFormTemplate — Edit Mode", () => {
  const onSubmit = vi.fn();
  const onCancel = vi.fn();
  const onDelete = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it("shows 'Update [entityType]' as submit button text", () => {
    render(
      <EntityFormTemplate
        mode="edit"
        entityType="NPC"
        onSubmit={onSubmit}
        onCancel={onCancel}
        onDelete={onDelete}
        saving={false}
      >
        <input />
      </EntityFormTemplate>
    );
    expect(screen.getByText(/update npc/i)).toBeInTheDocument();
  });

  it("shows delete button in edit mode", () => {
    render(
      <EntityFormTemplate
        mode="edit"
        entityType="NPC"
        onSubmit={onSubmit}
        onCancel={onCancel}
        onDelete={onDelete}
        saving={false}
      >
        <input />
      </EntityFormTemplate>
    );
    expect(screen.getByText(/delete/i)).toBeInTheDocument();
  });

  it("shows saving state as 'Updating...'", () => {
    render(
      <EntityFormTemplate
        mode="edit"
        entityType="NPC"
        onSubmit={onSubmit}
        onCancel={onCancel}
        saving={true}
      >
        <input />
      </EntityFormTemplate>
    );
    expect(screen.getByText(/updating/i)).toBeInTheDocument();
  });

  it("calls onDelete when delete is clicked", async () => {
    const user = userEvent.setup();
    render(
      <EntityFormTemplate
        mode="edit"
        entityType="NPC"
        onSubmit={onSubmit}
        onCancel={onCancel}
        onDelete={onDelete}
        saving={false}
      >
        <input />
      </EntityFormTemplate>
    );
    await user.click(screen.getByText(/delete/i));
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
