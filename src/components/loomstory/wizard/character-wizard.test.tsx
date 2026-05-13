import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CharacterWizard } from "./character-wizard";
import { DAGGERHEART_WIZARD_CONFIG } from "@/lib/character/configs/daggerheart-wizard";

// ─── Mocks ──────────────────────────────────────────────────

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn(), back: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

const mockClasses = [
  {
    id: "cls-warrior",
    name: "Warrior",
    is_subclass: false,
    parent_class_id: null,
    system_id: "sys-dh",
    hp_die: null,
    data: { domains: ["Blade", "Bone"], evasion: 11, hp_slots: 6, foundation_features: ["No Mercy"] },
    source: "Daggerheart SRD",
  },
  {
    id: "cls-druid",
    name: "Druid",
    is_subclass: false,
    parent_class_id: null,
    system_id: "sys-dh",
    hp_die: null,
    data: { domains: ["Sage", "Arcana"], evasion: 10, hp_slots: 6, foundation_features: ["Beastform"] },
    source: "Daggerheart SRD",
  },
];

const mockSubclasses = [
  {
    id: "sub-brave",
    name: "Call of the Brave",
    is_subclass: true,
    parent_class_id: "cls-warrior",
    system_id: "sys-dh",
    hp_die: null,
    data: {},
    source: "Daggerheart SRD",
  },
  {
    id: "sub-slayer",
    name: "Call of the Slayer",
    is_subclass: true,
    parent_class_id: "cls-warrior",
    system_id: "sys-dh",
    hp_die: null,
    data: {},
    source: "Daggerheart SRD",
  },
];

const mockClassFeatures = [
  {
    id: "feat-warrior-hope",
    name: "Warrior: No Mercy",
    ability_type: "class_feature",
    description:
      "Spend 3 Hope to gain a +1 bonus to your attack rolls until your next rest.",
    classes: ["Warrior"],
    data: { feature_category: "hope_feature" },
  },
  {
    id: "feat-warrior-class",
    name: "Warrior: Attack of Opportunity",
    ability_type: "class_feature",
    description:
      "When an adversary within Melee range tries to leave that range, you can mark a Stress to make a reaction attack.",
    classes: ["Warrior"],
    data: { feature_category: "class_feature" },
  },
  {
    id: "feat-druid-hope",
    name: "Druid: Druid's Hope",
    ability_type: "class_feature",
    description: "Druid hope description.",
    classes: ["Druid"],
    data: { feature_category: "hope_feature" },
  },
];

const mockAncestryFeatures = [
  // Faerie — 2 features
  {
    id: "feat-faerie-luckbender",
    name: "Faerie: Luckbender",
    ability_type: "ancestry_feature",
    description:
      "Once per session, after you or a willing ally within Close range makes an action roll, you can spend 3 Hope to reroll the Duality Dice.",
    classes: null,
    data: { ancestry: "Faerie", position: "top" },
  },
  {
    id: "feat-faerie-wings",
    name: "Faerie: Wings",
    ability_type: "ancestry_feature",
    description:
      "You can fly. While flying, you can mark a Stress after an adversary makes an attack against you to gain a +2 bonus to your Evasion against that attack.",
    classes: null,
    data: { ancestry: "Faerie", position: "bottom" },
  },
  // Katari — 2 features
  {
    id: "feat-katari-instincts",
    name: "Katari: Feline Instincts",
    ability_type: "ancestry_feature",
    description: "When you make an Agility Roll, you can spend 2 Hope to reroll your Hope Die.",
    classes: null,
    data: { ancestry: "Katari", position: "top" },
  },
  {
    id: "feat-katari-claws",
    name: "Katari: Retracting Claws",
    ability_type: "ancestry_feature",
    description:
      "Make an Agility Roll to scratch a target within Melee range. On a success, they become temporarily Vulnerable.",
    classes: null,
    data: { ancestry: "Katari", position: "bottom" },
  },
];

const mockCommunityFeatures = [
  {
    id: "feat-highborne",
    name: "Highborne: Privilege",
    ability_type: "community_feature",
    description:
      "You have advantage on rolls to consort with nobles, negotiate prices, or leverage your reputation to get what you want.",
    classes: null,
    data: { community: "Highborne" },
  },
  {
    id: "feat-wanderborne",
    name: "Wanderborne: Nomadic Pack",
    ability_type: "community_feature",
    description:
      "Add a Nomadic Pack to your inventory. Once per session, you can spend a Hope to reach into this pack and pull out a mundane item.",
    classes: null,
    data: { community: "Wanderborne" },
  },
];

const mockSubclassFeatures = [
  {
    id: "feat-brave-foundation",
    name: "Call of the Brave: Courage",
    ability_type: "subclass_feature",
    description:
      "When you fail a roll with Fear, you gain a Hope. When you succeed with Hope, you can mark a Stress to gain an additional Hope.",
    classes: ["Warrior"],
    data: { feature_category: "foundation_feature", subclass: "Call of the Brave" },
  },
  {
    id: "feat-brave-spec",
    name: "Call of the Brave: Battle-Hardened",
    ability_type: "subclass_feature",
    description: "Once per long rest, when you take damage, you can reduce that damage to 0.",
    classes: ["Warrior"],
    data: { feature_category: "specialization_feature", subclass: "Call of the Brave" },
  },
  {
    id: "feat-brave-mastery",
    name: "Call of the Brave: Unstoppable",
    ability_type: "subclass_feature",
    description: "While you have at least 1 Hit Point, you cannot be Restrained or Stunned.",
    classes: ["Warrior"],
    data: { feature_category: "mastery_feature", subclass: "Call of the Brave" },
  },
];

// Mock useStepData to return classes / subclasses / subclass features depending on config
let useStepDataCallCount = 0;
type MockedStepConfig = {
  dataSource?: { table?: string; filter?: Record<string, unknown> };
};
vi.mock("@/lib/character/use-step-data", () => ({
  useStepData: (
    config: MockedStepConfig | undefined,
    _systemId: unknown,
    dependValue?: unknown
  ) => {
    useStepDataCallCount++;
    const table = config?.dataSource?.table;
    const filter = config?.dataSource?.filter as Record<string, unknown> | undefined;

    // compendium_classes — base classes (no depend) or subclasses (with depend)
    if (table === "compendium_classes") {
      if (!dependValue) {
        return { data: mockClasses, loading: false, error: null };
      }
      return {
        data: mockSubclasses.filter((s) => s.parent_class_id === dependValue),
        loading: false,
        error: null,
      };
    }

    // compendium_abilities — subclass features filtered by parent class name
    if (table === "compendium_abilities" && filter?.ability_type === "subclass_feature") {
      if (!dependValue) return { data: [], loading: false, error: null };
      return {
        data: mockSubclassFeatures.filter((f) => f.classes.includes(dependValue as string)),
        loading: false,
        error: null,
      };
    }

    // compendium_abilities — class features (all classes, fetched up-front)
    if (table === "compendium_abilities" && filter?.ability_type === "class_feature") {
      return { data: mockClassFeatures, loading: false, error: null };
    }

    // compendium_abilities — ancestry features (fetched up-front, no dependency)
    if (table === "compendium_abilities" && filter?.ability_type === "ancestry_feature") {
      return { data: mockAncestryFeatures, loading: false, error: null };
    }

    // compendium_abilities — community features (fetched up-front, no dependency)
    if (table === "compendium_abilities" && filter?.ability_type === "community_feature") {
      return { data: mockCommunityFeatures, loading: false, error: null };
    }

    return { data: [], loading: false, error: null };
  },
}));

vi.mock("@/lib/character/save-new-character", () => ({
  saveNewCharacter: vi.fn().mockResolvedValue({ characterId: "new-char-id" }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ─── Tests ──────────────────────────────────────────────────

describe("CharacterWizard", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    campaignId: "campaign-1",
    systemId: "sys-dh",
    systemSlug: "daggerheart",
    userId: "user-1",
    wizardConfig: DAGGERHEART_WIZARD_CONFIG,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useStepDataCallCount = 0;
  });

  it("renders the name step first", () => {
    render(<CharacterWizard {...defaultProps} />);
    expect(screen.getByText("Name Your Hero")).toBeInTheDocument();
    expect(screen.getByText("Character Name")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<CharacterWizard {...defaultProps} open={false} />);
    expect(screen.queryByText("Name Your Hero")).not.toBeInTheDocument();
  });

  it("disables continue when name is empty", () => {
    render(<CharacterWizard {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("enables continue when name is entered", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);

    await user.type(screen.getByRole("textbox"), "Kael");
    expect(screen.getByRole("button", { name: "Continue" })).not.toBeDisabled();
  });

  it("navigates to class pick after entering name and clicking continue", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);

    await user.type(screen.getByRole("textbox"), "Kael");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText("Choose Your Class")).toBeInTheDocument();
  });

  it("shows class cards on class pick step", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);

    await user.type(screen.getByRole("textbox"), "Kael");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText("Warrior")).toBeInTheDocument();
    expect(screen.getByText("Druid")).toBeInTheDocument();
  });

  it("shows progress bar with correct phase count", () => {
    render(<CharacterWizard {...defaultProps} />);
    // Should show phase labels (desktop) — Name, Class, Heritage, Traits, Create
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Create")).toBeInTheDocument();
  });

  it("shows back button on class pick step", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);

    await user.type(screen.getByRole("textbox"), "Kael");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText("Back")).toBeInTheDocument();
  });

  it("navigates back to name step when back is clicked", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);

    await user.type(screen.getByRole("textbox"), "Kael");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await user.click(screen.getByText("Back"));
    expect(screen.getByText("Name Your Hero")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<CharacterWizard {...defaultProps} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("class cards show Hope Feature and Class Feature with descriptions when expanded", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);

    // Step 1: enter name and advance to class pick
    await user.type(screen.getByRole("textbox"), "Kael");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Expand the Warrior card
    await user.click(screen.getByText("Warrior"));

    // Hope Feature
    expect(screen.getByText("Hope Feature")).toBeInTheDocument();
    expect(screen.getByText("No Mercy")).toBeInTheDocument();
    expect(screen.getByText(/Spend 3 Hope to gain a \+1 bonus/)).toBeInTheDocument();

    // Class Feature
    expect(screen.getByText("Class Feature")).toBeInTheDocument();
    expect(screen.getByText("Attack of Opportunity")).toBeInTheDocument();
    expect(
      screen.getByText(/When an adversary within Melee range tries to leave/)
    ).toBeInTheDocument();
  });

  it("subclass cards show feature details and parent class stats when expanded", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);

    // Step 1: enter name
    await user.type(screen.getByRole("textbox"), "Kael");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Step 2: pick Warrior
    await user.click(screen.getByText("Warrior"));
    await user.click(screen.getByRole("button", { name: /choose warrior/i }));

    // Step 3: should be on subclass pick — expand "Call of the Brave"
    expect(screen.getByText("Choose Your Path")).toBeInTheDocument();
    await user.click(screen.getByText("Call of the Brave"));

    // Parent class stat (Evasion 11 from Warrior) should appear on the subclass card
    expect(screen.getByText("Evasion")).toBeInTheDocument();
    expect(screen.getByText("11")).toBeInTheDocument();

    // Foundation feature
    expect(screen.getByText("Foundation Feature")).toBeInTheDocument();
    expect(screen.getByText("Courage")).toBeInTheDocument();
    expect(screen.getByText(/When you fail a roll with Fear/)).toBeInTheDocument();

    // Specialization feature
    expect(screen.getByText("Specialization Features")).toBeInTheDocument();
    expect(screen.getByText("Battle-Hardened")).toBeInTheDocument();

    // Mastery feature
    expect(screen.getByText("Mastery Features")).toBeInTheDocument();
    expect(screen.getByText("Unstoppable")).toBeInTheDocument();
  });

  // ─── Heritage step (ancestry + community card pickers) ─────

  it("ancestry step shows one card per ancestry (grouped by data.ancestry)", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);

    // Walk: name → class → subclass → ancestry
    await user.type(screen.getByRole("textbox"), "Kael");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByText("Warrior"));
    await user.click(screen.getByRole("button", { name: /choose warrior/i }));
    await user.click(screen.getByText("Call of the Brave"));
    await user.click(screen.getByRole("button", { name: /choose call of the brave/i }));

    // Heritage step (ancestry first)
    expect(screen.getByText(/Choose Your Ancestry|Your Heritage|Ancestry/)).toBeInTheDocument();

    // Faerie + Katari each show up once as cards (mock has 4 feature rows → 2 ancestries)
    const faerieMatches = screen.getAllByText("Faerie");
    expect(faerieMatches.length).toBeGreaterThanOrEqual(1);
    const katariMatches = screen.getAllByText("Katari");
    expect(katariMatches.length).toBeGreaterThanOrEqual(1);
  });

  it("ancestry card shows both ancestry features with descriptions when expanded", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);

    await user.type(screen.getByRole("textbox"), "Kael");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByText("Warrior"));
    await user.click(screen.getByRole("button", { name: /choose warrior/i }));
    await user.click(screen.getByText("Call of the Brave"));
    await user.click(screen.getByRole("button", { name: /choose call of the brave/i }));

    // Expand the Faerie card
    await user.click(screen.getByText("Faerie"));

    expect(screen.getByText("Luckbender")).toBeInTheDocument();
    expect(screen.getByText(/Once per session, after you or a willing ally/)).toBeInTheDocument();
    expect(screen.getByText("Wings")).toBeInTheDocument();
    expect(screen.getByText(/You can fly\. While flying/)).toBeInTheDocument();
  });

  it("community step shows one card per community with its feature", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);

    // Walk through to community step
    await user.type(screen.getByRole("textbox"), "Kael");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByText("Warrior"));
    await user.click(screen.getByRole("button", { name: /choose warrior/i }));
    await user.click(screen.getByText("Call of the Brave"));
    await user.click(screen.getByRole("button", { name: /choose call of the brave/i }));
    // Pick Faerie as ancestry to advance to community step
    await user.click(screen.getByText("Faerie"));
    await user.click(screen.getByRole("button", { name: /choose faerie/i }));

    // Both communities should now be visible
    expect(screen.getByText("Highborne")).toBeInTheDocument();
    expect(screen.getByText("Wanderborne")).toBeInTheDocument();

    // Expand Highborne — should show its Privilege feature
    await user.click(screen.getByText("Highborne"));
    expect(screen.getByText("Privilege")).toBeInTheDocument();
    expect(screen.getByText(/advantage on rolls to consort with nobles/)).toBeInTheDocument();
  });

  it("selecting ancestry and community shows them in the review summary", async () => {
    const user = userEvent.setup();
    render(<CharacterWizard {...defaultProps} />);

    // Full happy path — fastest viable inputs at each step
    await user.type(screen.getByRole("textbox"), "Kael");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByText("Warrior"));
    await user.click(screen.getByRole("button", { name: /choose warrior/i }));
    await user.click(screen.getByText("Call of the Brave"));
    await user.click(screen.getByRole("button", { name: /choose call of the brave/i }));
    await user.click(screen.getByText("Katari"));
    await user.click(screen.getByRole("button", { name: /choose katari/i }));
    await user.click(screen.getByText("Wanderborne"));
    await user.click(screen.getByRole("button", { name: /choose wanderborne/i }));

    // Pick the standard array for the 6 traits
    const selects = screen.getAllByRole("combobox");
    const values = ["3", "2", "1", "1", "0", "-1"];
    for (let i = 0; i < selects.length; i++) {
      await user.selectOptions(selects[i], values[i]);
    }
    // Mark two traits (any two checkboxes)
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);
    await user.click(checkboxes[1]);

    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Review summary should list ancestry + community
    expect(screen.getByText("Katari")).toBeInTheDocument();
    expect(screen.getByText("Wanderborne")).toBeInTheDocument();
  });
});
