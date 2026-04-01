import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IconButton } from "./icon-button";
import { Trash2, Copy, Settings } from "lucide-react";

describe("IconButton", () => {
  it("renders with an icon", () => {
    render(<IconButton icon={Settings} label="Settings" onClick={() => {}} />);
    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
  });

  it("applies gold-glow class for hover effect", () => {
    render(<IconButton icon={Settings} label="Settings" onClick={() => {}} />);
    const btn = screen.getByRole("button", { name: "Settings" });
    expect(btn.className).toMatch(/gold-glow/);
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<IconButton icon={Copy} label="Copy" onClick={onClick} />);
    await user.click(screen.getByRole("button", { name: "Copy" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("supports destructive variant", () => {
    render(<IconButton icon={Trash2} label="Delete" onClick={() => {}} variant="destructive" />);
    const btn = screen.getByRole("button", { name: "Delete" });
    expect(btn.className).toMatch(/text-destructive/);
  });

  it("can be disabled", () => {
    render(<IconButton icon={Settings} label="Settings" onClick={() => {}} disabled />);
    expect(screen.getByRole("button", { name: "Settings" })).toBeDisabled();
  });
});
