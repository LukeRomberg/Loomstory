import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SkeletonCard, SkeletonList } from "./skeleton-card";

describe("SkeletonCard", () => {
  it("renders a skeleton card", () => {
    const { container } = render(<SkeletonCard />);
    const skeletons = container.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBeGreaterThanOrEqual(2); // title + description
  });

  it("has grain class", () => {
    const { container } = render(<SkeletonCard />);
    const card = container.querySelector("[data-slot='card']");
    expect(card?.className).toContain("grain");
  });
});

describe("SkeletonList", () => {
  it("renders default 6 skeleton cards", () => {
    const { container } = render(<SkeletonList />);
    const cards = container.querySelectorAll("[data-slot='card']");
    expect(cards.length).toBe(6);
  });

  it("renders specified count of skeleton cards", () => {
    const { container } = render(<SkeletonList count={3} />);
    const cards = container.querySelectorAll("[data-slot='card']");
    expect(cards.length).toBe(3);
  });

  it("uses grid layout", () => {
    const { container } = render(<SkeletonList />);
    const grid = container.firstElementChild;
    expect(grid?.className).toContain("grid");
  });
});
