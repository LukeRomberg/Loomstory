import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CampaignSelectImage } from "./campaign-select-image";

function makeCampaigns(count: number, role: "gm" | "player" = "gm") {
  return Array.from({ length: count }, (_, i) => ({
    id: `c${i + 1}`,
    name: `Campaign ${i + 1}`,
    role,
  }));
}

describe("CampaignSelectImage", () => {
  describe("rendering", () => {
    it("renders a hotspot for each campaign on the current page", () => {
      render(
        <CampaignSelectImage
          campaigns={makeCampaigns(3)}
          page={0}
          onPageChange={vi.fn()}
          onCreateCampaign={vi.fn()}
        />
      );
      expect(screen.getAllByTestId("campaign-hotspot")).toHaveLength(3);
    });

    it("renders at most 9 hotspots per page", () => {
      render(
        <CampaignSelectImage
          campaigns={makeCampaigns(15)}
          page={0}
          onPageChange={vi.fn()}
          onCreateCampaign={vi.fn()}
        />
      );
      expect(screen.getAllByTestId("campaign-hotspot")).toHaveLength(9);
    });

    it("renders no hotspots when there are no campaigns", () => {
      render(
        <CampaignSelectImage
          campaigns={[]}
          page={0}
          onPageChange={vi.fn()}
          onCreateCampaign={vi.fn()}
        />
      );
      expect(screen.queryAllByTestId("campaign-hotspot")).toHaveLength(0);
    });
  });

  describe("hotspot links and labels", () => {
    it("each hotspot is an <a> linking to /campaign/{id}", () => {
      render(
        <CampaignSelectImage
          campaigns={[{ id: "abc", name: "The Saga", role: "gm" }]}
          page={0}
          onPageChange={vi.fn()}
          onCreateCampaign={vi.fn()}
        />
      );
      const link = screen.getByLabelText("The Saga");
      expect(link.tagName).toBe("A");
      expect(link).toHaveAttribute("href", "/campaign/abc");
    });

    it("uses the campaign name as an accessible label", () => {
      render(
        <CampaignSelectImage
          campaigns={[
            { id: "a", name: "Alpha", role: "gm" },
            { id: "b", name: "Beta", role: "player" },
          ]}
          page={0}
          onPageChange={vi.fn()}
          onCreateCampaign={vi.fn()}
        />
      );
      expect(screen.getByLabelText("Alpha")).toBeInTheDocument();
      expect(screen.getByLabelText("Beta")).toBeInTheDocument();
    });

    it("renders the campaign name visibly on each book", () => {
      render(
        <CampaignSelectImage
          campaigns={[{ id: "a", name: "Alpha", role: "gm" }]}
          page={0}
          onPageChange={vi.fn()}
          onCreateCampaign={vi.fn()}
        />
      );
      expect(screen.getByText("Alpha")).toBeInTheDocument();
    });
  });

  describe("role badges", () => {
    it("renders the GM badge on GM-role hotspots", () => {
      render(
        <CampaignSelectImage
          campaigns={[{ id: "a", name: "Alpha", role: "gm" }]}
          page={0}
          onPageChange={vi.fn()}
          onCreateCampaign={vi.fn()}
        />
      );
      expect(screen.getByTestId("role-badge-gm")).toBeInTheDocument();
      expect(screen.queryByTestId("role-badge-player")).not.toBeInTheDocument();
    });

    it("renders the Player badge on non-GM hotspots", () => {
      render(
        <CampaignSelectImage
          campaigns={[{ id: "a", name: "Alpha", role: "player" }]}
          page={0}
          onPageChange={vi.fn()}
          onCreateCampaign={vi.fn()}
        />
      );
      expect(screen.getByTestId("role-badge-player")).toBeInTheDocument();
      expect(screen.queryByTestId("role-badge-gm")).not.toBeInTheDocument();
    });
  });

  describe("pagination", () => {
    it("hides arrows when campaigns.length <= 9", () => {
      render(
        <CampaignSelectImage
          campaigns={makeCampaigns(9)}
          page={0}
          onPageChange={vi.fn()}
          onCreateCampaign={vi.fn()}
        />
      );
      expect(
        screen.queryByRole("button", { name: /previous shelf/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /next shelf/i })
      ).not.toBeInTheDocument();
    });

    it("shows arrows when campaigns.length > 9", () => {
      render(
        <CampaignSelectImage
          campaigns={makeCampaigns(10)}
          page={0}
          onPageChange={vi.fn()}
          onCreateCampaign={vi.fn()}
        />
      );
      expect(
        screen.getByRole("button", { name: /previous shelf/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /next shelf/i })
      ).toBeInTheDocument();
    });

    it("disables prev on page 0", () => {
      render(
        <CampaignSelectImage
          campaigns={makeCampaigns(10)}
          page={0}
          onPageChange={vi.fn()}
          onCreateCampaign={vi.fn()}
        />
      );
      expect(
        screen.getByRole("button", { name: /previous shelf/i })
      ).toBeDisabled();
    });

    it("disables next on the last page", () => {
      render(
        <CampaignSelectImage
          campaigns={makeCampaigns(10)}
          page={1}
          onPageChange={vi.fn()}
          onCreateCampaign={vi.fn()}
        />
      );
      expect(
        screen.getByRole("button", { name: /next shelf/i })
      ).toBeDisabled();
    });

    it("calls onPageChange(page + 1) when next is clicked", async () => {
      const onPageChange = vi.fn();
      const user = userEvent.setup();
      render(
        <CampaignSelectImage
          campaigns={makeCampaigns(10)}
          page={0}
          onPageChange={onPageChange}
          onCreateCampaign={vi.fn()}
        />
      );
      await user.click(screen.getByRole("button", { name: /next shelf/i }));
      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it("calls onPageChange(page - 1) when prev is clicked", async () => {
      const onPageChange = vi.fn();
      const user = userEvent.setup();
      render(
        <CampaignSelectImage
          campaigns={makeCampaigns(10)}
          page={1}
          onPageChange={onPageChange}
          onCreateCampaign={vi.fn()}
        />
      );
      await user.click(
        screen.getByRole("button", { name: /previous shelf/i })
      );
      expect(onPageChange).toHaveBeenCalledWith(0);
    });

    it("renders only the slice for the current page", () => {
      render(
        <CampaignSelectImage
          campaigns={makeCampaigns(15)}
          page={1}
          onPageChange={vi.fn()}
          onCreateCampaign={vi.fn()}
        />
      );
      // Page 1 = items 10..15 (6 campaigns)
      expect(screen.getAllByTestId("campaign-hotspot")).toHaveLength(6);
      expect(screen.queryByLabelText("Campaign 1")).not.toBeInTheDocument();
      expect(screen.getByLabelText("Campaign 10")).toBeInTheDocument();
      expect(screen.getByLabelText("Campaign 15")).toBeInTheDocument();
    });
  });

  describe("create button overlay", () => {
    it("renders a floating + button that emits onCreateCampaign", async () => {
      const onCreateCampaign = vi.fn();
      const user = userEvent.setup();
      render(
        <CampaignSelectImage
          campaigns={[]}
          page={0}
          onPageChange={vi.fn()}
          onCreateCampaign={onCreateCampaign}
        />
      );
      const btn = screen.getByRole("button", { name: /new campaign/i });
      await user.click(btn);
      expect(onCreateCampaign).toHaveBeenCalledOnce();
    });
  });
});
