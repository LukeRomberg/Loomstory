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

  it("auto-opens the help popup on initial mount for the class pick step", () => {
    render(<CharacterWizard {...defaultProps} />);
    expect(screen.getByTestId("help-popup")).toBeInTheDocument();
    // The first-step helpText is the class_pick help copy now that name was moved to review.
    expect(screen.getByText(/Every class has two domains/)).toBeInTheDocument();
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

  // ─── Tips toggle ─────────────────────────────────────────────
  //
  // A "Show tips" checkbox at the top of the wizard lets players disable the
  // auto-opening help popup. Manual `?` clicks still work either way.

  it("Show tips checkbox is rendered and checked by default", () => {
    render(<CharacterWizard {...defaultProps} />);
    const checkbox = screen.getByRole("checkbox", { name: /show tips/i });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();
  });

  it("unchecking Show tips prevents auto-opening on subsequent steps", () => {
    render(<CharacterWizard {...defaultProps} />);

    // First step popup is already open. Dismiss it.
    dismissHelpPopup();

    // Now disable tips.
    fireEvent.click(screen.getByRole("checkbox", { name: /show tips/i }));

    // Advance to subclass — popup must NOT auto-open with tips off.
    fireEvent.click(screen.getByText("Warrior"));
    fireEvent.click(screen.getByRole("button", { name: /choose warrior/i }));
    expect(screen.queryByTestId("help-popup")).not.toBeInTheDocument();
  });

  it("manual ? click still opens the popup even with tips disabled", () => {
    render(<CharacterWizard {...defaultProps} />);

    dismissHelpPopup();
    fireEvent.click(screen.getByRole("checkbox", { name: /show tips/i })); // off
    fireEvent.click(screen.getByText("Warrior"));
    fireEvent.click(screen.getByRole("button", { name: /choose warrior/i }));
    // No auto-popup
    expect(screen.queryByTestId("help-popup")).not.toBeInTheDocument();

    // Manual ? click still works
    fireEvent.click(screen.getByRole("button", { name: /show help/i }));
    expect(screen.getByTestId("help-popup")).toBeInTheDocument();
  });

  it("re-checking Show tips on a step that hasn't been dismissed re-opens the popup", () => {
    render(<CharacterWizard {...defaultProps} />);

    // Dismiss the class_pick popup, then turn tips off.
    dismissHelpPopup();
    const checkbox = screen.getByRole("checkbox", { name: /show tips/i });
    fireEvent.click(checkbox);

    // Advance to subclass — no auto-popup because tips are off.
    fireEvent.click(screen.getByText("Warrior"));
    fireEvent.click(screen.getByRole("button", { name: /choose warrior/i }));
    expect(screen.queryByTestId("help-popup")).not.toBeInTheDocument();

    // Re-enable tips on the same (un-dismissed) step — popup auto-opens now.
    fireEvent.click(checkbox);
    expect(screen.getByTestId("help-popup")).toBeInTheDocument();
  });

  it("does not auto-open when navigating back to a previously dismissed step", () => {
    render(<CharacterWizard {...defaultProps} />);

    // Dismiss on class_pick step (the first step now)
    dismissHelpPopup();
    expect(screen.queryByTestId("help-popup")).not.toBeInTheDocument();

    // Pick a class to advance to subclass_pick — popup auto-opens for the new step
    fireEvent.click(screen.getByText("Warrior"));
    fireEvent.click(screen.getByRole("button", { name: /choose warrior/i }));
    expect(screen.getByTestId("help-popup")).toBeInTheDocument();

    // Dismiss on subclass_pick too
    dismissHelpPopup();
    expect(screen.queryByTestId("help-popup")).not.toBeInTheDocument();

    // Back to class_pick — popup must NOT reopen (sticky dismissal per modal-open)
    fireEvent.click(screen.getByText("Back"));
    expect(screen.queryByTestId("help-popup")).not.toBeInTheDocument();
  });
});
