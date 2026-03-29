import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VisibilityToggle } from "./visibility-toggle";

describe("VisibilityToggle", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows eye icon when visible (gm_only=false)", () => {
    const { container } = render(
      <VisibilityToggle gmOnly={false} onToggle={vi.fn()} />
    );
    const btn = screen.getByRole("button");
    expect(btn.getAttribute("title")).toContain("Hide");
  });

  it("shows eye-off icon when hidden (gm_only=true)", () => {
    render(<VisibilityToggle gmOnly={true} onToggle={vi.fn()} />);
    const btn = screen.getByRole("button");
    expect(btn.getAttribute("title")).toContain("visible");
  });

  it("calls onToggle when clicked", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<VisibilityToggle gmOnly={true} onToggle={onToggle} />);
    await user.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("shows loading state when toggling", () => {
    render(<VisibilityToggle gmOnly={true} onToggle={vi.fn()} loading={true} />);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
  });
});
