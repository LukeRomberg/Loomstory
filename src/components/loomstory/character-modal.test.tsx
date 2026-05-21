"use client";

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { CharacterModal } from "./character-modal";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          is: () => ({
            order: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
    }),
  }),
}));

vi.mock("@/components/loomstory/wizard/character-creation-wizard", () => ({
  CharacterCreationWizard: ({ open }: { open: boolean }) =>
    open ? <div data-testid="character-wizard">Wizard</div> : null,
}));

const baseProps = {
  campaignId: "campaign-1",
  userId: "user-1",
  role: "gm",
  systemId: "system-1",
  open: true,
  onOpenChange: vi.fn(),
};

describe("CharacterModal — Create flow", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows error toast and keeps modal open when systemSlug is null", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <CharacterModal {...baseProps} systemSlug={null} onOpenChange={onOpenChange} />
    );
    await waitFor(() =>
      expect(screen.getByText("New Character")).toBeInTheDocument()
    );
    await user.click(screen.getByText("New Character"));
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringMatching(/not available/i),
      expect.objectContaining({
        description: expect.stringMatching(/daggerheart/i),
      })
    );
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(screen.queryByTestId("character-wizard")).not.toBeInTheDocument();
  });

  it("shows error toast when systemSlug is unsupported (e.g. dnd5e)", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <CharacterModal {...baseProps} systemSlug="dnd5e" onOpenChange={onOpenChange} />
    );
    await waitFor(() =>
      expect(screen.getByText("New Character")).toBeInTheDocument()
    );
    await user.click(screen.getByText("New Character"));
    expect(toast.error).toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(screen.queryByTestId("character-wizard")).not.toBeInTheDocument();
  });

  it("closes parent modal and does not toast when systemSlug is daggerheart", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <CharacterModal
        {...baseProps}
        systemSlug="daggerheart"
        onOpenChange={onOpenChange}
      />
    );
    await waitFor(() =>
      expect(screen.getByText("New Character")).toBeInTheDocument()
    );
    await user.click(screen.getByText("New Character"));
    expect(toast.error).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
