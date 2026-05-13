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
});
