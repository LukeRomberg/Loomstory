import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewCampaignBook } from "./new-campaign-book";

describe("NewCampaignBook", () => {
  it("renders the New Campaign label", () => {
    render(<NewCampaignBook onClick={vi.fn()} />);
    expect(screen.getByText(/new campaign/i)).toBeInTheDocument();
  });

  it("renders a dice emblem", () => {
    render(<NewCampaignBook onClick={vi.fn()} />);
    expect(screen.getByTestId("new-campaign-emblem")).toBeInTheDocument();
  });

  it("applies dashed border styling", () => {
    render(<NewCampaignBook onClick={vi.fn()} />);
    const book = screen.getByTestId("new-campaign-book");
    expect(book.className).toContain("border-dashed");
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<NewCampaignBook onClick={onClick} />);
    await user.click(screen.getByTestId("new-campaign-book"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("merges caller-provided className", () => {
    render(<NewCampaignBook onClick={vi.fn()} className="custom-class" />);
    const book = screen.getByTestId("new-campaign-book");
    expect(book.className).toContain("custom-class");
  });
});
