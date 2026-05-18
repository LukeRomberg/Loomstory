import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WikilinkText } from "./wikilink-text";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

const defaultProps = {
  text: "The party met [[Gareth the Bold]] at [[Ironhold|the iron city]].",
  campaignId: "campaign-1",
  resolvedEntities: [
    { name: "Gareth the Bold", entityType: "npc", entityId: "npc-1", resolved: true },
    { name: "Ironhold", entityType: "location", entityId: "loc-1", resolved: true },
  ],
};

describe("WikilinkText — Rendering (WIKI-03)", () => {
  it("renders resolved wikilinks as clickable links", () => {
    render(<WikilinkText {...defaultProps} />);
    expect(screen.getByText("Gareth the Bold")).toBeInTheDocument();
    expect(screen.getByText("the iron city")).toBeInTheDocument();
  });

  it("renders resolved links with gold styling", () => {
    render(<WikilinkText {...defaultProps} />);
    const link = screen.getByText("Gareth the Bold");
    expect(link.className).toContain("text-gold");
  });

  it("renders plain text between wikilinks", () => {
    render(<WikilinkText {...defaultProps} />);
    expect(screen.getByText(/the party met/i)).toBeInTheDocument();
  });

  it("navigates to entity page when link is clicked", async () => {
    const user = userEvent.setup();
    render(<WikilinkText {...defaultProps} />);
    await user.click(screen.getByText("Gareth the Bold"));
    expect(mockPush).toHaveBeenCalledWith(
      "/campaign/campaign-1/npcs?selected=npc-1"
    );
  });

  it("renders unresolved wikilinks in a distinct style", () => {
    const props = {
      ...defaultProps,
      text: "Heard about [[Unknown NPC]].",
      resolvedEntities: [],
    };
    render(<WikilinkText {...props} />);
    const unresolved = screen.getByText("Unknown NPC");
    expect(unresolved.className).toContain("text-muted-foreground");
  });

  it("renders text without wikilinks as plain text", () => {
    render(<WikilinkText {...defaultProps} text="Just plain text." resolvedEntities={[]} />);
    expect(screen.getByText("Just plain text.")).toBeInTheDocument();
  });

  it("shows entity type tooltip on hover for resolved links", () => {
    render(<WikilinkText {...defaultProps} />);
    const link = screen.getByText("Gareth the Bold");
    expect(link.getAttribute("title") || link.getAttribute("data-entity-type")).toBeTruthy();
  });
});
