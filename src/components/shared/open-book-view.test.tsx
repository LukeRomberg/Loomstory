import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OpenBookView } from "./open-book-view";

describe("OpenBookView", () => {
  it("renders leftPage and rightPage content", () => {
    render(
      <OpenBookView
        leftPage={<div>Left content</div>}
        rightPage={<div>Right content</div>}
        onBack={vi.fn()}
      />
    );
    expect(screen.getByText("Left content")).toBeInTheDocument();
    expect(screen.getByText("Right content")).toBeInTheDocument();
  });

  it("renders a back button that calls onBack", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(
      <OpenBookView
        leftPage={<div />}
        rightPage={<div />}
        onBack={onBack}
      />
    );
    await user.click(screen.getByLabelText(/back to bookshelf/i));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("renders a new button when onNew is provided", async () => {
    const user = userEvent.setup();
    const onNew = vi.fn();
    render(
      <OpenBookView
        leftPage={<div />}
        rightPage={<div />}
        onBack={vi.fn()}
        onNew={onNew}
        newAriaLabel="New thing"
      />
    );
    await user.click(screen.getByLabelText("New thing"));
    expect(onNew).toHaveBeenCalledOnce();
  });

  it("omits the new button when onNew is not provided", () => {
    render(
      <OpenBookView
        leftPage={<div />}
        rightPage={<div />}
        onBack={vi.fn()}
      />
    );
    expect(screen.queryByLabelText(/^new/i)).not.toBeInTheDocument();
  });

  it("renders children (modals etc.)", () => {
    render(
      <OpenBookView
        leftPage={<div />}
        rightPage={<div />}
        onBack={vi.fn()}
      >
        <div>Modal content</div>
      </OpenBookView>
    );
    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });

  it("includes debug borders only when debugBorder is true", () => {
    const { rerender } = render(
      <OpenBookView
        leftPage={<div data-testid="left-pane">L</div>}
        rightPage={<div data-testid="right-pane">R</div>}
        onBack={vi.fn()}
      />
    );
    const leftWrapper = screen.getByTestId("open-book-left");
    const rightWrapper = screen.getByTestId("open-book-right");
    expect(leftWrapper.style.border).toBe("");
    expect(rightWrapper.style.border).toBe("");

    rerender(
      <OpenBookView
        leftPage={<div data-testid="left-pane">L</div>}
        rightPage={<div data-testid="right-pane">R</div>}
        onBack={vi.fn()}
        debugBorder
      />
    );
    const leftWrapperDbg = screen.getByTestId("open-book-left");
    expect(leftWrapperDbg.style.border).toContain("hotpink");
  });
});
