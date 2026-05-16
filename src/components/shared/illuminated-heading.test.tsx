import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { IlluminatedHeading } from "./illuminated-heading";

describe("IlluminatedHeading", () => {
  it("renders the text content", () => {
    render(<IlluminatedHeading>The Realm of Veldrin</IlluminatedHeading>);
    expect(screen.getByText("The Realm of Veldrin")).toBeInTheDocument();
  });

  it("renders as h2 by default", () => {
    render(<IlluminatedHeading>Default</IlluminatedHeading>);
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });

  it("renders as h1 when level=1", () => {
    render(<IlluminatedHeading level={1}>Top</IlluminatedHeading>);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("renders as h3 when level=3", () => {
    render(<IlluminatedHeading level={3}>Sub</IlluminatedHeading>);
    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
  });

  it("applies the heading font", () => {
    render(<IlluminatedHeading>Test</IlluminatedHeading>);
    const heading = screen.getByRole("heading");
    expect(heading.className).toContain("font-heading");
  });

  it("uppercases the text via tracking + transform", () => {
    render(<IlluminatedHeading>lowercase</IlluminatedHeading>);
    const heading = screen.getByRole("heading");
    expect(heading.className).toContain("uppercase");
  });

  it("renders a decorative gold divider beneath the text", () => {
    render(<IlluminatedHeading>Test</IlluminatedHeading>);
    expect(screen.getByTestId("gold-divider")).toBeInTheDocument();
  });

  it("merges caller-provided className", () => {
    render(
      <IlluminatedHeading className="custom-class">Test</IlluminatedHeading>
    );
    const heading = screen.getByRole("heading");
    expect(heading.className).toContain("custom-class");
  });
});
