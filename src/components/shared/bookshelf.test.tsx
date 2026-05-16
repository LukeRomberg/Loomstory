import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Bookshelf } from "./bookshelf";

describe("Bookshelf", () => {
  it("renders the campaign name banner", () => {
    render(
      <Bookshelf campaignName="The Crimson Accord">
        <div>book</div>
      </Bookshelf>
    );
    expect(screen.getByText("The Crimson Accord")).toBeInTheDocument();
  });

  it("renders an optional subtitle (system, level range, etc.)", () => {
    render(
      <Bookshelf campaignName="Test" subtitle="Daggerheart · Levels 1–5">
        <div>book</div>
      </Bookshelf>
    );
    expect(screen.getByText("Daggerheart · Levels 1–5")).toBeInTheDocument();
  });

  it("does not render a subtitle element when not provided", () => {
    render(
      <Bookshelf campaignName="Test">
        <div>book</div>
      </Bookshelf>
    );
    expect(screen.queryByTestId("bookshelf-subtitle")).not.toBeInTheDocument();
  });

  it("renders book children", () => {
    render(
      <Bookshelf campaignName="Test">
        <span>Book One</span>
        <span>Book Two</span>
      </Bookshelf>
    );
    expect(screen.getByText("Book One")).toBeInTheDocument();
    expect(screen.getByText("Book Two")).toBeInTheDocument();
  });

  it("applies the wood/leather shelf surface", () => {
    render(
      <Bookshelf campaignName="Test">
        <div>book</div>
      </Bookshelf>
    );
    const shelf = screen.getByTestId("bookshelf-surface");
    expect(shelf.className).toContain("leather-bg");
  });

  it("merges caller-provided className on the outer element", () => {
    const { container } = render(
      <Bookshelf campaignName="Test" className="custom-class">
        <div>book</div>
      </Bookshelf>
    );
    const outer = container.firstChild as HTMLElement;
    expect(outer.className).toContain("custom-class");
  });
});
