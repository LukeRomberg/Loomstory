import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { HelpPopup } from "./help-popup";

describe("HelpPopup", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not render when closed", () => {
    render(
      <HelpPopup
        open={false}
        onClose={vi.fn()}
        title="Name Your Hero"
        helpText="Welcome to character creation."
      />
    );
    expect(screen.queryByTestId("help-popup")).not.toBeInTheDocument();
  });

  it("renders title and helpText when open", () => {
    render(
      <HelpPopup
        open
        onClose={vi.fn()}
        title="Name Your Hero"
        helpText="Welcome to character creation."
      />
    );
    expect(screen.getByText("Name Your Hero")).toBeInTheDocument();
    expect(screen.getByText("Welcome to character creation.")).toBeInTheDocument();
  });

  it("Got it button starts disabled with a countdown label", () => {
    render(
      <HelpPopup
        open
        onClose={vi.fn()}
        title="Name Your Hero"
        helpText="Welcome."
        countdownSeconds={3}
      />
    );
    const button = screen.getByRole("button", { name: /got it/i });
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Got it (3s)");
  });

  it("Got it button enables after the countdown finishes", () => {
    render(
      <HelpPopup
        open
        onClose={vi.fn()}
        title="Name Your Hero"
        helpText="Welcome."
        countdownSeconds={3}
      />
    );
    const button = screen.getByRole("button", { name: /got it/i });
    expect(button).toBeDisabled();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(button).not.toBeDisabled();
    expect(button).toHaveTextContent("Got it");
    expect(button).not.toHaveTextContent("(");
  });

  it("calls onClose when Got it is clicked after the countdown", () => {
    const onClose = vi.fn();
    render(
      <HelpPopup
        open
        onClose={onClose}
        title="Name Your Hero"
        helpText="Welcome."
        countdownSeconds={3}
      />
    );

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    fireEvent.click(screen.getByRole("button", { name: /got it/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("resets the countdown when the popup is re-opened", () => {
    const { rerender } = render(
      <HelpPopup
        open
        onClose={vi.fn()}
        title="Step"
        helpText="."
        countdownSeconds={3}
      />
    );
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByRole("button", { name: /got it/i })).not.toBeDisabled();

    // Close, then re-open
    rerender(
      <HelpPopup
        open={false}
        onClose={vi.fn()}
        title="Step"
        helpText="."
        countdownSeconds={3}
      />
    );
    rerender(
      <HelpPopup
        open
        onClose={vi.fn()}
        title="Step"
        helpText="."
        countdownSeconds={3}
      />
    );

    // Countdown is back to 3, button disabled again
    const button = screen.getByRole("button", { name: /got it/i });
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Got it (3s)");
  });
});
