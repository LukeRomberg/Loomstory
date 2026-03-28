import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EntityVersions } from "./entity-versions";
import { mockEntityVersions } from "@/test/mocks";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const defaultProps = {
  versions: mockEntityVersions,
};

describe("EntityVersions — Display (VER-01)", () => {
  it("renders version history heading", () => {
    render(<EntityVersions {...defaultProps} />);
    expect(screen.getByText(/version history/i)).toBeInTheDocument();
  });

  it("renders version count", () => {
    render(<EntityVersions {...defaultProps} />);
    expect(screen.getByText(/3 version/i)).toBeInTheDocument();
  });

  it("renders version numbers", () => {
    render(<EntityVersions {...defaultProps} />);
    expect(screen.getByText(/v3/)).toBeInTheDocument();
    expect(screen.getByText(/v2/)).toBeInTheDocument();
    expect(screen.getByText(/v1/)).toBeInTheDocument();
  });

  it("renders who made each change", () => {
    render(<EntityVersions {...defaultProps} />);
    expect(screen.getAllByText(/Luke/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/System/)).toBeInTheDocument();
  });

  it("renders when each change was made", () => {
    render(<EntityVersions {...defaultProps} />);
    // Should show relative or formatted dates
    expect(screen.getAllByText(/2026/).length).toBeGreaterThanOrEqual(1);
  });

  it("shows versions in reverse chronological order (newest first)", () => {
    render(<EntityVersions {...defaultProps} />);
    const allText = document.body.textContent ?? "";
    const v3Pos = allText.indexOf("v3");
    const v1Pos = allText.indexOf("v1");
    expect(v3Pos).toBeLessThan(v1Pos);
  });

  it("shows empty state when no versions", () => {
    render(<EntityVersions versions={[]} />);
    expect(screen.getByText(/no version history/i)).toBeInTheDocument();
  });
});

describe("EntityVersions — Diffs (VER-02)", () => {
  it("can expand a version to see the diff", async () => {
    const user = userEvent.setup();
    render(<EntityVersions {...defaultProps} />);
    // Click on the v3 card to expand it
    const v3Card = screen.getByText(/v3/).closest("[data-slot='card']");
    if (v3Card) await user.click(v3Card);
    // v3 diff: description changed, gm_notes added
    expect(screen.getByText(/description/i)).toBeInTheDocument();
  });

  it("shows changed fields between versions", async () => {
    const user = userEvent.setup();
    render(<EntityVersions {...defaultProps} />);
    const v3Card = screen.getByText(/v3/).closest("[data-slot='card']");
    if (v3Card) await user.click(v3Card);
    // gm_notes went from null to a value
    expect(screen.getByText(/gm_notes/)).toBeInTheDocument();
  });

  it("highlights added fields in the diff", async () => {
    const user = userEvent.setup();
    render(<EntityVersions {...defaultProps} />);
    const v3Card = screen.getByText(/v3/).closest("[data-slot='card']");
    if (v3Card) await user.click(v3Card);
    // gm_notes value should be visible
    expect(screen.getByText(/secretly working/i)).toBeInTheDocument();
  });

  it("shows field name changes between versions", async () => {
    const user = userEvent.setup();
    render(<EntityVersions {...defaultProps} />);
    const v3Card = screen.getByText(/v3/).closest("[data-slot='card']");
    if (v3Card) await user.click(v3Card);
    expect(screen.getByText(/description/)).toBeInTheDocument();
  });

  it("shows the first version as 'created'", () => {
    // "Created" badge is always visible on v1, no need to expand
    render(<EntityVersions {...defaultProps} />);
    expect(screen.getByText(/created/i)).toBeInTheDocument();
  });
});
