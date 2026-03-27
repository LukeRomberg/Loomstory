import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingScreen } from "./loading-screen";

describe("LoadingScreen", () => {
  it("renders with status role", () => {
    render(<LoadingScreen />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("uses panel layout by default", () => {
    render(<LoadingScreen />);
    const el = screen.getByRole("status");
    expect(el.className).toContain("h-full");
    expect(el.className).not.toContain("min-h-screen");
  });

  it("uses full layout when specified", () => {
    render(<LoadingScreen layout="full" />);
    const el = screen.getByRole("status");
    expect(el.className).toContain("min-h-screen");
  });
});
