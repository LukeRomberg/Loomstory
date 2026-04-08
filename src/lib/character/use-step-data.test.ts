import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useStepData } from "./use-step-data";
import type { WizardStepConfig } from "./wizard-types";

// Mock Supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: (...args: unknown[]) => {
        mockSelect(...args);
        return {
          eq: (...eqArgs: unknown[]) => {
            mockEq(...eqArgs);
            return {
              eq: (...eqArgs2: unknown[]) => {
                mockEq(...eqArgs2);
                return {
                  eq: (...eqArgs3: unknown[]) => {
                    mockEq(...eqArgs3);
                    return {
                      order: (...oArgs: unknown[]) => {
                        mockOrder(...oArgs);
                        return Promise.resolve({ data: [{ id: "1", name: "Test" }], error: null });
                      },
                    };
                  },
                  order: (...oArgs: unknown[]) => {
                    mockOrder(...oArgs);
                    return Promise.resolve({ data: [{ id: "1", name: "Test" }], error: null });
                  },
                };
              },
              order: (...oArgs: unknown[]) => {
                mockOrder(...oArgs);
                return Promise.resolve({ data: [{ id: "1", name: "Test" }], error: null });
              },
            };
          },
        };
      },
    }),
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
});
