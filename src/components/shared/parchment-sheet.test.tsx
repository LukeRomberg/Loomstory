import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ParchmentSheet } from "./parchment-sheet";

describe("ParchmentSheet", () => {
  it("renders children", () => {
    render(
      <ParchmentSheet>
        <p>Aged paper content</p>
      </ParchmentSheet>
    );
    expect(screen.getByText("Aged paper content")).toBeInTheDocument();
  });

  it("applies the parchment background utility", () => {
    const { container } = render(<ParchmentSheet>x</ParchmentSheet>);
    const sheet = container.firstChild as HTMLElement;
    expect(sheet.className).toContain("parchment");
  });

  it("renders 4 corner ornaments when ornate is true", () => {
    render(<ParchmentSheet ornate>x</ParchmentSheet>);
    const corners = screen.getAllByTestId("parchment-corner");
    expect(corners).toHaveLength(4);
  });

  it("does not render corner ornaments when ornate is false or unset", () => {
    render(<ParchmentSheet>x</ParchmentSheet>);
    expect(screen.queryAllByTestId("parchment-corner")).toHaveLength(0);
  });

  it("merges caller-provided className", () => {
    const { container } = render(
      <ParchmentSheet className="custom-class">x</ParchmentSheet>
    );
    const sheet = container.firstChild as HTMLElement;
    expect(sheet.className).toContain("custom-class");
    expect(sheet.className).toContain("parchment");
  });
});
