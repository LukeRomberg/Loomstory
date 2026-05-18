import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CharacterCreationShell } from "./character-creation-shell";

describe("CharacterCreationShell", () => {
  it("renders all four content slots", () => {
    render(
      <CharacterCreationShell
        topBar={<div>Top bar</div>}
        leftPage={<div>Left page</div>}
        rightPage={<div>Right page</div>}
        sheetPage={<div>Sheet page</div>}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText("Top bar")).toBeInTheDocument();
    expect(screen.getByText("Left page")).toBeInTheDocument();
    expect(screen.getByText("Right page")).toBeInTheDocument();
    expect(screen.getByText("Sheet page")).toBeInTheDocument();
  });

  it("renders footer content when provided", () => {
    render(
      <CharacterCreationShell
        topBar={null}
        leftPage={null}
        rightPage={null}
        sheetPage={null}
        footer={<div>Prev · Next</div>}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText("Prev · Next")).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <CharacterCreationShell
        topBar={null}
        leftPage={null}
        rightPage={null}
        sheetPage={null}
        onClose={onClose}
      />
    );
    await user.click(screen.getByLabelText(/close character creation/i));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("renders debug borders only when debugBorder is true", () => {
    const { rerender } = render(
      <CharacterCreationShell
        topBar={null}
        leftPage={null}
        rightPage={null}
        sheetPage={null}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByTestId("creation-left-zone").style.border).toBe("");

    rerender(
      <CharacterCreationShell
        topBar={null}
        leftPage={null}
        rightPage={null}
        sheetPage={null}
        onClose={vi.fn()}
        debugBorder
      />
    );
    expect(
      screen.getByTestId("creation-left-zone").style.border
    ).toContain("hotpink");
    expect(
      screen.getByTestId("creation-right-zone").style.border
    ).toContain("hotpink");
    expect(
      screen.getByTestId("creation-sheet-zone").style.border
    ).toContain("hotpink");
    expect(
      screen.getByTestId("creation-top-zone").style.border
    ).toContain("hotpink");
  });
});
