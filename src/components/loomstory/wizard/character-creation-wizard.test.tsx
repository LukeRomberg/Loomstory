import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockPush = vi.fn();
vi.mock("@/hooks/use-transition-router", () => ({
  useTransitionRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}));

const { mockClasses, mockClassFeatures } = vi.hoisted(() => ({
  mockClasses: [
    {
      id: "c1",
      name: "Warrior",
      is_subclass: false,
      parent_class_id: null,
      hp_die: "d10",
      data: {
        description: "Disciplined fighters with steel and grit.",
        hp_slots: 6,
        evasion: 11,
        hp_die: "d10",
      },
      source: "Daggerheart SRD",
    },
    {
      id: "c2",
      name: "Wizard",
      is_subclass: false,
      parent_class_id: null,
      hp_die: "d6",
      data: {},
      source: "Daggerheart SRD",
    },
  ],
  mockClassFeatures: [
    {
      id: "f1",
      name: "Warrior: Attack of Opportunity",
      ability_type: "class_feature",
      description: "Strike when an enemy moves past you.",
      level: 1,
      classes: ["Warrior"],
      source: null,
      data: { feature_category: "class_feature" },
    },
    {
      id: "f2",
      name: "Warrior: No Mercy",
      ability_type: "class_feature",
      description: "Spend Hope to do X.",
      level: 1,
      classes: ["Warrior"],
      source: null,
      data: { feature_category: "hope_feature" },
    },
  ],
}));

vi.mock("@/lib/character/use-step-data", () => ({
  useStepData: (step: { component: string } | undefined) => {
    if (step?.component === "card_picker") {
      return { data: mockClasses, loading: false, error: null };
    }
    return { data: mockClassFeatures, loading: false, error: null };
  },
}));

import { CharacterCreationWizard } from "./character-creation-wizard";
import type { WizardConfig } from "@/lib/character/wizard-types";

const wizardConfig: WizardConfig = {
  steps: {
    class_pick: {
      enabled: true,
      label: "Choose Your Class",
      subtitle: "A defining path",
      shortLabel: "Class",
      component: "card_picker",
    },
    subclass_pick: {
      enabled: true,
      label: "Choose a Subclass",
      shortLabel: "Subclass",
      component: "card_picker",
    },
    review: {
      enabled: true,
      label: "Behold",
      shortLabel: "Behold",
      component: "review_summary",
    },
  },
  phases: [
    { label: "Build", steps: ["class_pick", "subclass_pick", "review"] },
  ],
  classThemes: {
    Warrior: {
      gradient: "from-red-700 to-red-900",
      borderColor: "border-red-500",
      textColor: "text-red-100",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      icon: (() => null) as any,
      domains: ["Blade", "Bone"],
    },
  },
};

function renderWizard(open = true) {
  return render(
    <CharacterCreationWizard
      open={open}
      onClose={vi.fn()}
      campaignId="campaign-1"
      systemId="system-1"
      systemSlug="daggerheart"
      userId="user-1"
      wizardConfig={wizardConfig}
    />
  );
}

describe("CharacterCreationWizard", () => {
  it("renders nothing when open is false", () => {
    const { container } = renderWizard(false);
    expect(container.firstChild).toBeNull();
  });

  it("renders the step progress bar with the configured labels", () => {
    renderWizard();
    expect(screen.getByText("Class")).toBeInTheDocument();
    expect(screen.getByText("Subclass")).toBeInTheDocument();
    expect(screen.getByText("Behold")).toBeInTheDocument();
  });

  it("renders the class step heading + subtitle in dark leather", () => {
    renderWizard();
    expect(screen.getByText(/choose your class/i)).toBeInTheDocument();
    expect(screen.getByText(/a defining path/i)).toBeInTheDocument();
  });

  it("renders one button per class in the left page", () => {
    renderWizard();
    expect(screen.getByLabelText(/choose warrior/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/choose wizard/i)).toBeInTheDocument();
  });

  it("starts with no class selected and the right page prompting the player", () => {
    renderWizard();
    expect(screen.getByText(/pick a class to see its details/i)).toBeInTheDocument();
  });

  it("renders the selected class details on the right page after click", async () => {
    const user = userEvent.setup();
    renderWizard();
    await user.click(screen.getByLabelText(/choose warrior/i));
    expect(screen.getAllByText("Warrior").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/disciplined fighters/i)).toBeInTheDocument();
    expect(screen.getByText("HP Slots")).toBeInTheDocument();
    expect(screen.getAllByText("Evasion").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Hit Die")).toBeInTheDocument();
    expect(screen.getAllByText("Blade").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Bone").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Hope Feature").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Class Feature").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("No Mercy").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Attack of Opportunity").length).toBeGreaterThanOrEqual(1);
  });

  it("Continue is disabled until a class is selected", async () => {
    const user = userEvent.setup();
    renderWizard();
    const cont = screen.getByRole("button", { name: /continue/i });
    expect(cont).toBeDisabled();
    await user.click(screen.getByLabelText(/choose warrior/i));
    expect(cont).not.toBeDisabled();
  });

  it("Previous is disabled on the first step", () => {
    renderWizard();
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
  });

  it("clicking Continue advances to the next step", async () => {
    const user = userEvent.setup();
    renderWizard();
    await user.click(screen.getByLabelText(/choose warrior/i));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
  });
});
