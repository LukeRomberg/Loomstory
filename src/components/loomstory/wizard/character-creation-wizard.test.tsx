import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockPush = vi.fn();
vi.mock("@/hooks/use-transition-router", () => ({
  useTransitionRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}));

const {
  mockClasses,
  mockClassFeatures,
  mockSubclasses,
  mockSubclassFeatures,
  mockAncestryFeatures,
  mockCommunityFeatures,
} = vi.hoisted(() => ({
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
  mockSubclasses: [
    {
      id: "s1",
      name: "Call of the Brave",
      is_subclass: true,
      parent_class_id: "c1",
      hp_die: null,
      data: { description: "Brave Warriors charge ahead." },
      source: "Daggerheart SRD",
    },
    {
      id: "s2",
      name: "Call of the Slayer",
      is_subclass: true,
      parent_class_id: "c1",
      hp_die: null,
      data: { description: "Slayer Warriors are precise killers." },
      source: "Daggerheart SRD",
    },
    {
      id: "s3",
      name: "School of Knowledge",
      is_subclass: true,
      parent_class_id: "c2",
      hp_die: null,
      data: { description: "Knowledge wizards know everything." },
      source: "Daggerheart SRD",
    },
  ],
  mockSubclassFeatures: [
    {
      id: "sf1",
      name: "Call of the Brave: Battle-Hardened",
      ability_type: "subclass_feature",
      description: "Take less damage when bloodied.",
      level: 1,
      classes: ["Warrior"],
      source: null,
      data: { subclass: "Call of the Brave", feature_category: "foundation_feature" },
    },
    {
      id: "sf2",
      name: "Call of the Brave: Rallying Cry",
      ability_type: "subclass_feature",
      description: "Inspire your allies.",
      level: 5,
      classes: ["Warrior"],
      source: null,
      data: { subclass: "Call of the Brave", feature_category: "specialization_feature" },
    },
    {
      id: "sf3",
      name: "Call of the Brave: Unbreakable",
      ability_type: "subclass_feature",
      description: "You cannot be felled.",
      level: 8,
      classes: ["Warrior"],
      source: null,
      data: { subclass: "Call of the Brave", feature_category: "mastery_feature" },
    },
    {
      id: "sf4",
      name: "Call of the Slayer: Killer Instinct",
      ability_type: "subclass_feature",
      description: "Strike first, ask questions later.",
      level: 1,
      classes: ["Warrior"],
      source: null,
      data: { subclass: "Call of the Slayer", feature_category: "foundation_feature" },
    },
  ],
  mockAncestryFeatures: [
    {
      id: "af1",
      name: "Faerie: Luckbringer",
      ability_type: "ancestry_feature",
      description: "Re-roll a Hope die once per session.",
      level: null,
      classes: null,
      source: null,
      data: { ancestry: "Faerie", flavor: "Tiny winged beings of mischief." },
    },
    {
      id: "af2",
      name: "Faerie: Wings",
      ability_type: "ancestry_feature",
      description: "You can fly short distances.",
      level: null,
      classes: null,
      source: null,
      data: { ancestry: "Faerie", flavor: "Tiny winged beings of mischief." },
    },
    {
      id: "af3",
      name: "Clank: Purposeful Design",
      ability_type: "ancestry_feature",
      description: "Gain a +1 to a chosen trait.",
      level: null,
      classes: null,
      source: null,
      data: { ancestry: "Clank", flavor: "Mechanical beings of purpose." },
    },
    {
      id: "af4",
      name: "Clank: Efficient",
      ability_type: "ancestry_feature",
      description: "Mark Stress to repeat an Experience roll.",
      level: null,
      classes: null,
      source: null,
      data: { ancestry: "Clank", flavor: "Mechanical beings of purpose." },
    },
  ],
  mockCommunityFeatures: [
    {
      id: "cf1",
      name: "Highborne: Privilege",
      ability_type: "community_feature",
      description: "You have a +1 to Presence rolls with nobility.",
      level: null,
      classes: null,
      source: null,
      data: {
        community: "Highborne",
        flavor: "Born to wealth and influence.",
        adjectives: ["Refined", "Demanding"],
      },
    },
    {
      id: "cf2",
      name: "Wanderborne: Nomadic Eye",
      ability_type: "community_feature",
      description: "You always know which way is north.",
      level: null,
      classes: null,
      source: null,
      data: {
        community: "Wanderborne",
        flavor: "Roamers of the wild roads.",
      },
    },
  ],
}));

vi.mock("@/lib/character/use-step-data", () => ({
  useStepData: (
    step:
      | {
          component?: string;
          dataSource?: { table?: string; filter?: Record<string, unknown> };
        }
      | undefined,
    _systemId?: string,
    dependValue?: string | null
  ) => {
    const filter = step?.dataSource?.filter ?? {};
    // Classes (parent classes only)
    if (step?.dataSource?.table === "compendium_classes" && filter.is_subclass === false) {
      return { data: mockClasses, loading: false, error: null };
    }
    // Subclasses — narrow by parent_class_id from the dependsOn class_pick selection
    if (step?.dataSource?.table === "compendium_classes" && filter.is_subclass === true) {
      const rows = dependValue
        ? mockSubclasses.filter((s) => s.parent_class_id === dependValue)
        : [];
      return { data: rows, loading: false, error: null };
    }
    // Synthetic subclass-feature fetch (ability_type subclass_feature)
    if (
      step?.dataSource?.table === "compendium_abilities" &&
      filter.ability_type === "subclass_feature"
    ) {
      return { data: mockSubclassFeatures, loading: false, error: null };
    }
    // Ancestry features
    if (
      step?.dataSource?.table === "compendium_abilities" &&
      filter.ability_type === "ancestry_feature"
    ) {
      return { data: mockAncestryFeatures, loading: false, error: null };
    }
    // Community features
    if (
      step?.dataSource?.table === "compendium_abilities" &&
      filter.ability_type === "community_feature"
    ) {
      return { data: mockCommunityFeatures, loading: false, error: null };
    }
    // Fallback — class features (no dataSource configured in the existing wizard).
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
      dataSource: {
        table: "compendium_classes",
        filter: { is_subclass: false },
      },
    },
    subclass_pick: {
      enabled: true,
      label: "Choose a Subclass",
      subtitle: "Pick a path",
      shortLabel: "Subclass",
      component: "card_picker",
      dataSource: {
        table: "compendium_classes",
        filter: { is_subclass: true },
        dependsOn: "class_pick",
        dependColumn: "parent_class_id",
      },
    },
    ancestry_pick: {
      enabled: true,
      label: "Choose Your Ancestry",
      subtitle: "Your lineage",
      shortLabel: "Ancestry",
      component: "card_picker",
      dataSource: {
        table: "compendium_abilities",
        filter: { ability_type: "ancestry_feature" },
      },
    },
    community_pick: {
      enabled: true,
      label: "Choose Your Community",
      subtitle: "Your upbringing",
      shortLabel: "Community",
      component: "card_picker",
      dataSource: {
        table: "compendium_abilities",
        filter: { ability_type: "community_feature" },
      },
    },
    review: {
      enabled: true,
      label: "Behold",
      shortLabel: "Behold",
      component: "review_summary",
    },
  },
  phases: [
    {
      label: "Build",
      steps: [
        "class_pick",
        "subclass_pick",
        "ancestry_pick",
        "community_pick",
        "review",
      ],
    },
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
    expect(screen.getByText("Step 2 of 5")).toBeInTheDocument();
  });
});

// ─── Helpers ────────────────────────────────────────────────

async function advanceToSubclassStep(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByLabelText(/choose warrior/i));
  await user.click(screen.getByRole("button", { name: /continue/i }));
}

async function advanceToAncestryStep(user: ReturnType<typeof userEvent.setup>) {
  await advanceToSubclassStep(user);
  await user.click(screen.getByLabelText(/choose call of the brave/i));
  await user.click(screen.getByRole("button", { name: /continue/i }));
}

async function advanceToCommunityStep(user: ReturnType<typeof userEvent.setup>) {
  await advanceToAncestryStep(user);
  await user.click(screen.getByLabelText(/choose faerie/i));
  await user.click(screen.getByRole("button", { name: /continue/i }));
}

describe("CharacterCreationWizard — subclass step", () => {
  it("shows the subclass step heading + subtitle after advancing from class", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToSubclassStep(user);
    expect(screen.getByText(/choose a subclass/i)).toBeInTheDocument();
    expect(screen.getByText(/pick a path/i)).toBeInTheDocument();
  });

  it("only lists subclasses for the picked parent class", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToSubclassStep(user);
    expect(screen.getByLabelText(/choose call of the brave/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/choose call of the slayer/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/choose school of knowledge/i)).not.toBeInTheDocument();
  });

  it("starts with no subclass selected and the right page prompting the player", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToSubclassStep(user);
    expect(screen.getByText(/pick a subclass to see its details/i)).toBeInTheDocument();
  });

  it("Continue is disabled until a subclass is selected", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToSubclassStep(user);
    const cont = screen.getByRole("button", { name: /continue/i });
    expect(cont).toBeDisabled();
    await user.click(screen.getByLabelText(/choose call of the brave/i));
    expect(cont).not.toBeDisabled();
  });

  it("shows foundation + specialization + mastery feature buckets on the right", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToSubclassStep(user);
    await user.click(screen.getByLabelText(/choose call of the brave/i));
    expect(screen.getByText("Foundation Feature")).toBeInTheDocument();
    expect(screen.getByText("Specialization Features")).toBeInTheDocument();
    expect(screen.getByText("Mastery Features")).toBeInTheDocument();
    // Foundation features render in the detail panel and the sheet preview, so
    // expect at least one occurrence rather than exactly one.
    expect(screen.getAllByText("Battle-Hardened").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Rallying Cry")).toBeInTheDocument();
    expect(screen.getByText("Unbreakable")).toBeInTheDocument();
  });

  it("does not bleed another subclass's features into the detail", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToSubclassStep(user);
    await user.click(screen.getByLabelText(/choose call of the brave/i));
    expect(screen.queryByText("Killer Instinct")).not.toBeInTheDocument();
  });

  it("Continue advances from subclass to ancestry", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToSubclassStep(user);
    await user.click(screen.getByLabelText(/choose call of the brave/i));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByText(/choose your ancestry/i)).toBeInTheDocument();
  });
});

describe("CharacterCreationWizard — ancestry step", () => {
  it("shows the ancestry step heading + subtitle after advancing through subclass", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToAncestryStep(user);
    expect(screen.getByText(/choose your ancestry/i)).toBeInTheDocument();
    expect(screen.getByText(/your lineage/i)).toBeInTheDocument();
  });

  it("renders one button per distinct ancestry", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToAncestryStep(user);
    expect(screen.getByLabelText(/choose faerie/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/choose clank/i)).toBeInTheDocument();
  });

  it("renders a female/male variant radiogroup with male selected by default", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToAncestryStep(user);
    const group = screen.getByRole("radiogroup", { name: /portrait variant/i });
    expect(group).toBeInTheDocument();
    const female = screen.getByRole("radio", { name: /^female$/i });
    const male = screen.getByRole("radio", { name: /^male$/i });
    expect(male).toHaveAttribute("aria-checked", "true");
    expect(female).toHaveAttribute("aria-checked", "false");
  });

  it("flips the variant when Female is clicked", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToAncestryStep(user);
    await user.click(screen.getByRole("radio", { name: /^female$/i }));
    expect(screen.getByRole("radio", { name: /^female$/i })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.getByRole("radio", { name: /^male$/i })).toHaveAttribute(
      "aria-checked",
      "false"
    );
  });

  it("renders portrait thumbnails for ancestries with art", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToAncestryStep(user);
    // Faerie has female + male art; default variant is male.
    const faerieBtn = screen.getByLabelText(/choose faerie/i);
    const img = faerieBtn.querySelector("img");
    expect(img).toBeTruthy();
    expect(img?.getAttribute("src")).toMatch(/Faerie/i);
  });

  it("Continue is disabled until an ancestry is selected", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToAncestryStep(user);
    const cont = screen.getByRole("button", { name: /continue/i });
    expect(cont).toBeDisabled();
    await user.click(screen.getByLabelText(/choose faerie/i));
    expect(cont).not.toBeDisabled();
  });

  it("shows the ancestry description and both features in the detail panel on selection", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToAncestryStep(user);
    await user.click(screen.getByLabelText(/choose faerie/i));
    expect(screen.getByText(/tiny winged beings of mischief/i)).toBeInTheDocument();
    // Ancestry features also surface in the sheet preview, so expect ≥ 1.
    expect(screen.getAllByText("Luckbringer").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Wings").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/re-roll a hope die/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/fly short distances/i).length).toBeGreaterThanOrEqual(1);
  });

  it("shows the ancestry portrait beside the description in the detail panel", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToAncestryStep(user);
    await user.click(screen.getByLabelText(/choose faerie/i));
    const detail = screen.getByTestId("ancestry-detail");
    const img = detail.querySelector("img");
    expect(img).toBeTruthy();
    expect(img?.getAttribute("src")).toMatch(/Faerie/i);
  });

  it("Continue advances from ancestry to community", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToAncestryStep(user);
    await user.click(screen.getByLabelText(/choose faerie/i));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByText(/choose your community/i)).toBeInTheDocument();
  });
});

describe("CharacterCreationWizard — community step", () => {
  it("shows the community step heading + subtitle", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToCommunityStep(user);
    expect(screen.getByText(/choose your community/i)).toBeInTheDocument();
    expect(screen.getByText(/your upbringing/i)).toBeInTheDocument();
  });

  it("renders one button per distinct community", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToCommunityStep(user);
    expect(screen.getByLabelText(/choose highborne/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/choose wanderborne/i)).toBeInTheDocument();
  });

  it("Continue is disabled until a community is selected", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToCommunityStep(user);
    const cont = screen.getByRole("button", { name: /continue/i });
    expect(cont).toBeDisabled();
    await user.click(screen.getByLabelText(/choose highborne/i));
    expect(cont).not.toBeDisabled();
  });

  it("shows the chosen community's description + feature on the right", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToCommunityStep(user);
    await user.click(screen.getByLabelText(/choose highborne/i));
    expect(screen.getByText(/born to wealth and influence/i)).toBeInTheDocument();
    // Community feature also surfaces in the sheet preview, so expect ≥ 1.
    expect(screen.getAllByText("Privilege").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/\+1 to presence rolls/i).length).toBeGreaterThanOrEqual(1);
  });

  it("Continue advances past community to the next step", async () => {
    const user = userEvent.setup();
    renderWizard();
    await advanceToCommunityStep(user);
    await user.click(screen.getByLabelText(/choose highborne/i));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByText("Step 5 of 5")).toBeInTheDocument();
  });
});
