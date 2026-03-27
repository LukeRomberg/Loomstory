import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmptyState } from "./empty-state";
import { ScrollText } from "lucide-react";

describe("EmptyState", () => {
  it("renders message", () => {
    render(<EmptyState icon={ScrollText} message="No items yet" />);
    expect(screen.getByText("No items yet")).toBeInTheDocument();
  });

  it("renders action button when provided", () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        icon={ScrollText}
        message="No items yet"
        action={{ label: "Create one", onClick }}
      />
    );
    expect(screen.getByText("Create one")).toBeInTheDocument();
  });

  it("calls action onClick when button is clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <EmptyState
        icon={ScrollText}
        message="No items yet"
        action={{ label: "Create one", onClick }}
      />
    );
    await user.click(screen.getByText("Create one"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not render button when no action provided", () => {
    render(<EmptyState icon={ScrollText} message="No items yet" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
