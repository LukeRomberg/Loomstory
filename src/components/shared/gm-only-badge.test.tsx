import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GmOnlyBadge } from "./gm-only-badge";

describe("GmOnlyBadge", () => {
  it("renders 'GM Only' text", () => {
    render(<GmOnlyBadge />);
    expect(screen.getByText(/gm only/i)).toBeInTheDocument();
  });

  it("renders eye-off icon", () => {
    const { container } = render(<GmOnlyBadge />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("uses secondary variant by default", () => {
    const { container } = render(<GmOnlyBadge />);
    const badge = container.querySelector("[data-slot='badge']");
    expect(badge?.getAttribute("data-variant")).toBe("secondary");
  });
});
