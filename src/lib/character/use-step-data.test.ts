import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useStepData } from "./use-step-data";
import type { WizardStepConfig } from "./wizard-types";

// ─── Supabase Mock ──────────────────────────────────────────
//
// A self-referencing chain supports any combination of .eq() / .contains() /
// .order() calls. .order() resolves the chain (it's the final step in the hook).

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockContains = vi.fn();
const mockOrder = vi.fn();
const mockFrom = vi.fn();

type Chain = {
  eq: (...args: unknown[]) => Chain;
  contains: (...args: unknown[]) => Chain;
  order: (...args: unknown[]) => Promise<{ data: unknown[]; error: null }>;
};

const chain: Chain = {
  eq: (...args) => {
    mockEq(...args);
    return chain;
  },
  contains: (...args) => {
    mockContains(...args);
    return chain;
  },
  order: (...args) => {
    mockOrder(...args);
    return Promise.resolve({ data: [{ id: "1", name: "Test" }], error: null });
  },
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: (...args: unknown[]) => {
      mockFrom(...args);
      return {
        select: (...selArgs: unknown[]) => {
          mockSelect(...selArgs);
          return chain;
        },
      };
    },
  }),
}));

describe("useStepData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty data when no dataSource is configured", () => {
    const stepConfig: WizardStepConfig = {
      enabled: true,
      label: "Name",
      component: "text_field_group",
    };

    const { result } = renderHook(() => useStepData(stepConfig, "system-1"));
    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it("returns empty data when systemId is null", () => {
    const stepConfig: WizardStepConfig = {
      enabled: true,
      label: "Class",
      component: "card_picker",
      dataSource: { table: "compendium_classes", filter: { is_subclass: false } },
    };

    const { result } = renderHook(() => useStepData(stepConfig, null));
    expect(result.current.data).toEqual([]);
  });

  it("fetches data when dataSource is configured", async () => {
    const stepConfig: WizardStepConfig = {
      enabled: true,
      label: "Class",
      component: "card_picker",
      dataSource: { table: "compendium_classes", filter: { is_subclass: false } },
    };

    const { result } = renderHook(() => useStepData(stepConfig, "system-1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toHaveLength(1);
    expect(mockSelect).toHaveBeenCalledWith("*");
  });

  it("returns empty data when dependsOn is set but dependValue is null", () => {
    const stepConfig: WizardStepConfig = {
      enabled: true,
      label: "Subclass",
      component: "card_picker",
      dataSource: {
        table: "compendium_classes",
        filter: { is_subclass: true },
        dependsOn: "class_pick",
        dependColumn: "parent_class_id",
      },
    };

    const { result } = renderHook(() => useStepData(stepConfig, "system-1", null));
    expect(result.current.data).toEqual([]);
  });

  it("fetches data when dependValue is provided", async () => {
    const stepConfig: WizardStepConfig = {
      enabled: true,
      label: "Subclass",
      component: "card_picker",
      dataSource: {
        table: "compendium_classes",
        filter: { is_subclass: true },
        dependsOn: "class_pick",
        dependColumn: "parent_class_id",
      },
    };

    const { result } = renderHook(() =>
      useStepData(stepConfig, "system-1", "class-uuid-123")
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toHaveLength(1);
  });

  // ─── Dependent filter type ─────────────────────────────────

  it("uses .eq() for the dependent filter by default", async () => {
    const stepConfig: WizardStepConfig = {
      enabled: true,
      label: "Subclass",
      component: "card_picker",
      dataSource: {
        table: "compendium_classes",
        filter: { is_subclass: true },
        dependsOn: "class_pick",
        dependColumn: "parent_class_id",
      },
    };

    renderHook(() => useStepData(stepConfig, "system-1", "class-warrior"));

    await waitFor(() => {
      const calledWithDependent = mockEq.mock.calls.some(
        ([col, val]) => col === "parent_class_id" && val === "class-warrior"
      );
      expect(calledWithDependent).toBe(true);
    });

    expect(mockContains).not.toHaveBeenCalled();
  });

  it("uses .contains() when dependType is 'contains'", async () => {
    const stepConfig: WizardStepConfig = {
      enabled: true,
      label: "Subclass Features",
      component: "ability_picker",
      dataSource: {
        table: "compendium_abilities",
        filter: { ability_type: "subclass_feature" },
        dependsOn: "class_pick",
        dependColumn: "classes",
        dependType: "contains",
      },
    };

    renderHook(() => useStepData(stepConfig, "system-1", "Warrior"));

    await waitFor(() => {
      expect(mockContains).toHaveBeenCalledWith("classes", ["Warrior"]);
    });

    // Make sure `.eq` was NOT used for the dependent column (only for static filters and system_id)
    const eqCalledWithClasses = mockEq.mock.calls.some(([col]) => col === "classes");
    expect(eqCalledWithClasses).toBe(false);
  });
});
