import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BackButton } from "./back-button";

describe("BackButton", () => {
  it("renders with 'Back' text", () => {
    render(<BackButton onClick={vi.fn()} />);
    expect(screen.getByText("Back")).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<BackButton onClick={onClick} />);
    await user.click(screen.getByText("Back"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders as a button element", () => {
    render(<BackButton onClick={vi.fn()} />);
    expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument();
  });
});
