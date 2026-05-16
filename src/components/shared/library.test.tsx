import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Library } from "./library";

describe("Library", () => {
  it("renders children", () => {
    render(
      <Library>
        <div>Shelf A</div>
        <div>Shelf B</div>
      </Library>
    );
    expect(screen.getByText("Shelf A")).toBeInTheDocument();
    expect(screen.getByText("Shelf B")).toBeInTheDocument();
  });

  it("applies the wood background utility", () => {
    const { container } = render(<Library>x</Library>);
    const lib = container.firstChild as HTMLElement;
    expect(lib.className).toContain("wood");
  });

  it("merges caller-provided className", () => {
    const { container } = render(
      <Library className="custom-class">x</Library>
    );
    const lib = container.firstChild as HTMLElement;
    expect(lib.className).toContain("custom-class");
    expect(lib.className).toContain("wood");
  });
});
