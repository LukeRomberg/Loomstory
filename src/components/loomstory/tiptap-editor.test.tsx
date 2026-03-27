import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TiptapEditor } from "./tiptap-editor";

describe("TiptapEditor", () => {
  it("renders the editor container", () => {
    render(<TiptapEditor content="" onChange={vi.fn()} />);
    // The editor renders a toolbar and editor content area
    const container = document.querySelector(".rounded-lg");
    expect(container).toBeInTheDocument();
  });

  it("renders toolbar buttons when editable", () => {
    render(<TiptapEditor content="" onChange={vi.fn()} editable={true} />);
    // Bold, Italic, Strikethrough, etc.
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(10); // toolbar has ~12 buttons
  });

  it("hides toolbar when not editable", () => {
    render(
      <TiptapEditor content="" onChange={vi.fn()} editable={false} />
    );
    const buttons = screen.queryAllByRole("button");
    expect(buttons.length).toBe(0);
  });
});
