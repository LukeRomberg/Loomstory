import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Breadcrumb } from "./breadcrumb";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}));

describe("Breadcrumb", () => {
  it("renders the label text", () => {
    render(<Breadcrumb href="/dashboard" label="Test Campaign" />);
    expect(screen.getByText("Test Campaign")).toBeInTheDocument();
  });

  it("renders with a suffix", () => {
    render(<Breadcrumb href="/campaign/1/npcs" label="Test Campaign" suffix="NPCs" />);
    expect(screen.getByText(/Test Campaign/)).toBeInTheDocument();
    expect(screen.getByText(/NPCs/)).toBeInTheDocument();
  });

  it("navigates on click", async () => {
    const user = userEvent.setup();
    render(<Breadcrumb href="/dashboard" label="Back" />);
    await user.click(screen.getByText("Back"));
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("renders chevron icon", () => {
    const { container } = render(<Breadcrumb href="/test" label="Test" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
