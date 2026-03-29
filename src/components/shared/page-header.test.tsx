import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "./page-header";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("PageHeader", () => {
  it("renders the title", () => {
    render(<PageHeader title="NPCs" />);
    expect(screen.getByText("NPCs")).toBeInTheDocument();
  });

  it("renders the subtitle", () => {
    render(<PageHeader title="NPCs" subtitle="3 npcs in this campaign" />);
    expect(screen.getByText("3 npcs in this campaign")).toBeInTheDocument();
  });

  it("renders action buttons", () => {
    render(
      <PageHeader title="NPCs" actions={<button>New NPC</button>} />
    );
    expect(screen.getByText("New NPC")).toBeInTheDocument();
  });

  it("renders breadcrumb when provided", () => {
    render(
      <PageHeader
        title="NPCs"
        breadcrumb={{ href: "/campaign/1", label: "Test Campaign" }}
      />
    );
    expect(screen.getByText("Test Campaign")).toBeInTheDocument();
  });

  it("renders without subtitle or actions", () => {
    render(<PageHeader title="Simple Page" />);
    expect(screen.getByText("Simple Page")).toBeInTheDocument();
  });
});
