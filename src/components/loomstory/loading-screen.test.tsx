import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingScreen } from "./loading-screen";

describe("LoadingScreen", () => {
  it("renders with status role and default Loading label", () => {
    render(<LoadingScreen />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("accepts a custom label", () => {
    render(<LoadingScreen label="Summoning..." />);
    expect(screen.getByText("Summoning...")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      "Summoning...",
    );
  });

  it("renders the candle-flicker monogram", () => {
    const { container } = render(<LoadingScreen />);
    expect(container.querySelector(".animate-candle-flicker")).not.toBeNull();
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toContain("loomstory-monogram");
  });

  it("uses panel layout by default (no fixed positioning)", () => {
    render(<LoadingScreen />);
    const el = screen.getByRole("status");
    expect(el.className).not.toContain("fixed");
    expect(el.className).toContain("min-h-[240px]");
  });

  it("uses full layout as a fixed viewport overlay when specified", () => {
    render(<LoadingScreen layout="full" />);
    const el = screen.getByRole("status");
    expect(el.className).toContain("fixed");
    expect(el.className).toContain("inset-0");
  });
});
