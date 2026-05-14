import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { CharacterWizard } from "./character-wizard";
import { DAGGERHEART_WIZARD_CONFIG } from "@/lib/character/configs/daggerheart-wizard";

// ─── Mocks ──────────────────────────────────────────────────
// HelpPopup is NOT mocked here — these tests verify auto-open and dismissal
// end-to-end. Sister file `character-wizard.test.tsx` mocks it away so its tests
// can focus on wizard mechanics.
//
// Interactions use fireEvent (synchronous) rather than userEvent because v14
// userEvent + fake timers can hang on click promises.

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), back: vi.fn(), replace: vi.fn() }),
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
];

vi.mock("@/lib/character/use-step-data", () => ({
  useStepData: () => ({ data: mockClasses, loading: false, error: null }),
}));

vi.mock("@/lib/character/save-new-character", () => ({
  saveNewCharacter: vi.fn().mockResolvedValue({ characterId: "new-char-id" }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ─── Helpers ────────────────────────────────────────────────

function dismissHelpPopup() {
  act(() => {
    vi.advanceTimersByTime(3000);
  });
  fireEvent.click(screen.getByRole("button", { name: /got it/i }));
}

// ─── Tests ──────────────────────────────────────────────────

describe("CharacterWizard help popup integration", () => {
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
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("auto-opens the help popup on initial mount for the name step", () => {
    render(<CharacterWizard {...defaultProps} />);
    expect(screen.getByTestId("help-popup")).toBeInTheDocument();
    expect(screen.getByText(/Welcome to character creation/)).toBeInTheDocument();
  });

  it("Got it button starts with a 3s countdown and is disabled", () => {
    render(<CharacterWizard {...defaultProps} />);
    const button = screen.getByRole("button", { name: /got it/i });
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Got it (3s)");
  });

  it("dismissing the popup hides it without auto-reopening on the same step", () => {
    render(<CharacterWizard {...defaultProps} />);
    expect(screen.getByTestId("help-popup")).toBeInTheDocument();
    dismissHelpPopup();
    expect(screen.queryByTestId("help-popup")).not.toBeInTheDocument();
  });

  it("clicking the ? button reopens the popup after dismissal", () => {
    render(<CharacterWizard {...defaultProps} />);

    dismissHelpPopup();
    expect(screen.queryByTestId("help-popup")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /show help/i }));
    expect(screen.getByTestId("help-popup")).toBeInTheDocument();
  });

  it("does not auto-open when navigating back to a previously dismissed step", () => {
    render(<CharacterWizard {...defaultProps} />);

    // Dismiss on name step
    dismissHelpPopup();
    expect(screen.queryByTestId("help-popup")).not.toBeInTheDocument();

    // Type a name and advance to class_pick — popup auto-opens for the new step
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Kael" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByTestId("help-popup")).toBeInTheDocument();

    // Dismiss on class_pick too
    dismissHelpPopup();
    expect(screen.queryByTestId("help-popup")).not.toBeInTheDocument();

    // Back to name — popup must NOT reopen (sticky dismissal per modal-open)
    fireEvent.click(screen.getByText("Back"));
    expect(screen.queryByTestId("help-popup")).not.toBeInTheDocument();
  });
});
