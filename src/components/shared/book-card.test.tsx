import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  BookCard,
  BookCardHeader,
  BookCardTitle,
  BookCardContent,
} from "./book-card";

describe("BookCard", () => {
  it("renders children", () => {
    render(
      <BookCard>
        <span>inside</span>
      </BookCard>
    );
    expect(screen.getByText("inside")).toBeInTheDocument();
  });

  it("uses the leather/parchment palette", () => {
    render(<BookCard data-testid="card">x</BookCard>);
    const el = screen.getByTestId("card");
    expect(el.className).toMatch(/bg-parchment/);
    expect(el.className).toMatch(/text-leather/);
    expect(el.className).toMatch(/border-leather/);
  });

  it("forwards className to the root", () => {
    render(
      <BookCard data-testid="card" className="extra-class">
        x
      </BookCard>
    );
    expect(screen.getByTestId("card").className).toMatch(/extra-class/);
  });

  it("renders title as leather-toned heading", () => {
    render(
      <BookCard>
        <BookCardHeader>
          <BookCardTitle>Description</BookCardTitle>
        </BookCardHeader>
        <BookCardContent>body</BookCardContent>
      </BookCard>
    );
    expect(screen.getByText("Description").className).toMatch(/text-leather/);
    expect(screen.getByText("body").className).toMatch(/text-leather/);
  });
});
