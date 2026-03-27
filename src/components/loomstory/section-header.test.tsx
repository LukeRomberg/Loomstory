import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionHeader } from "./section-header";

describe("SectionHeader", () => {
  it("renders children", () => {
    render(<SectionHeader>NPCs</SectionHeader>);
    expect(screen.getByText("NPCs")).toBeInTheDocument();
  });

  it("renders as h4", () => {
    render(<SectionHeader>Title</SectionHeader>);
    expect(screen.getByRole("heading", { level: 4 })).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<SectionHeader className="mt-8">Title</SectionHeader>);
    const heading = screen.getByRole("heading");
    expect(heading.className).toContain("mt-8");
  });
});
