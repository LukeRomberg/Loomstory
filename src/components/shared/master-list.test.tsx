import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MasterList, MasterListItem } from "./master-list";

describe("MasterList", () => {
  it("renders the title and count", () => {
    render(
      <MasterList
        title="NPCs"
        count={3}
        search=""
        onSearchChange={() => {}}
      >
        <div>x</div>
      </MasterList>
    );
    expect(screen.getByText(/npcs/i)).toBeInTheDocument();
    expect(screen.getByText("(3)")).toBeInTheDocument();
  });

  it("renders a search input bound to props", async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    render(
      <MasterList
        title="NPCs"
        count={0}
        search=""
        onSearchChange={onSearchChange}
        isEmpty
        emptyMessage="No NPCs yet."
      >
        {null}
      </MasterList>
    );
    await user.type(screen.getByPlaceholderText(/search/i), "a");
    expect(onSearchChange).toHaveBeenCalledWith("a");
  });

  it("shows the empty message when isEmpty", () => {
    render(
      <MasterList
        title="NPCs"
        count={0}
        search=""
        onSearchChange={() => {}}
        isEmpty
        emptyMessage="No NPCs yet."
      >
        {null}
      </MasterList>
    );
    expect(screen.getByText(/no npcs yet/i)).toBeInTheDocument();
  });

  it("renders children when not empty", () => {
    render(
      <MasterList
        title="NPCs"
        count={1}
        search=""
        onSearchChange={() => {}}
      >
        <div>child-row</div>
      </MasterList>
    );
    expect(screen.getByText("child-row")).toBeInTheDocument();
  });
});

describe("MasterListItem", () => {
  it("renders title and subtitle", () => {
    render(
      <MasterListItem
        onClick={() => {}}
        title="Gareth the Bold"
        subtitle={<>alive · ally</>}
      />
    );
    expect(screen.getByText("Gareth the Bold")).toBeInTheDocument();
    expect(screen.getByText(/alive/)).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <MasterListItem onClick={onClick} title="Gareth the Bold" />
    );
    await user.click(screen.getByText("Gareth the Bold"));
    expect(onClick).toHaveBeenCalled();
  });

  it("shows the EyeOff icon when hidden", () => {
    const { container } = render(
      <MasterListItem
        onClick={() => {}}
        title="Gareth the Bold"
        hidden
      />
    );
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("applies selected styling when selected is true", () => {
    render(
      <MasterListItem
        onClick={() => {}}
        title="Gareth the Bold"
        selected
      />
    );
    const button = screen.getByRole("button");
    expect(button.className).toMatch(/bg-leather/);
  });
});
