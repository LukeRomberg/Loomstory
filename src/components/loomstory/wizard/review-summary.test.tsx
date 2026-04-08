import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReviewSummary } from "./review-summary";
import type { ReviewSection } from "./review-summary";

const sections: ReviewSection[] = [
  {
    label: "Identity",
    items: [
      { label: "Name", value: "Kael" },
      { label: "Ancestry", value: "Katari" },
      { label: "Community", value: "Wanderborne" },
    ],
  },
  {
    label: "Path",
    items: [
      { label: "Class", value: "Warrior" },
      { label: "Subclass", value: "Call of the Slayer" },
    ],
  },
  {
    label: "Traits",
    items: [
      { label: "Agility", value: "+3 (marked)" },
      { label: "Strength", value: "+2" },
    ],
  },
];

describe("ReviewSummary", () => {
  it("renders all section labels", () => {
    render(<ReviewSummary sections={sections} onCreate={vi.fn()} />);
    expect(screen.getByText("Identity")).toBeInTheDocument();
    expect(screen.getByText("Path")).toBeInTheDocument();
    expect(screen.getByText("Traits")).toBeInTheDocument();
  });

  it("renders all item labels and values", () => {
    render(<ReviewSummary sections={sections} onCreate={vi.fn()} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Kael")).toBeInTheDocument();
    expect(screen.getByText("Warrior")).toBeInTheDocument();
    expect(screen.getByText("+3 (marked)")).toBeInTheDocument();
  });

  it("renders create button", () => {
    render(<ReviewSummary sections={sections} onCreate={vi.fn()} />);
    expect(screen.getByRole("button", { name: /create character/i })).toBeInTheDocument();
  });

  it("calls onCreate when create button is clicked", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    render(<ReviewSummary sections={sections} onCreate={onCreate} />);
    await user.click(screen.getByRole("button", { name: /create character/i }));
    expect(onCreate).toHaveBeenCalledOnce();
  });

  it("shows loading state on create button", () => {
    render(<ReviewSummary sections={sections} onCreate={vi.fn()} creating />);
    const btn = screen.getByRole("button", { name: /creating/i });
    expect(btn).toBeDisabled();
  });

  it("renders custom button label", () => {
    render(<ReviewSummary sections={sections} onCreate={vi.fn()} buttonLabel="Start Adventure" />);
    expect(screen.getByRole("button", { name: /start adventure/i })).toBeInTheDocument();
  });
});
