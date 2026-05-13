"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { WizardStepConfig } from "./wizard-types";

interface UseStepDataResult<T = Record<string, unknown>[]> {
  data: T;
  loading: boolean;
  error: string | null;
}

/**
 * Fetches data from Supabase based on a step's dataSource config.
 * Handles dependent filters (e.g., subclass filtered by parent class).
 */
export function useStepData(
  stepConfig: WizardStepConfig | undefined,
  systemId: string | null,
  dependValue?: string | null
): UseStepDataResult {
  const ds = stepConfig?.dataSource;
  const table = ds?.table ?? null;
  const filterJson = JSON.stringify(ds?.filter ?? null);
  const dependsOn = ds?.dependsOn ?? null;
  const dependColumn = ds?.dependColumn ?? null;
  const dependType = ds?.dependType ?? "eq";
  const shouldFetch = !!(table && systemId);

  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(shouldFetch);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!table || !systemId) {
      setLoading(false);
      return;
    }

    // If step depends on a parent value and it's not set yet, don't fetch
    if (dependsOn && !dependValue) {
      setData([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    async function fetchData() {
      const supabase = createClient();
      let query = supabase.from(table!).select("*").eq("system_id", systemId!);

      // Apply static filters
      const filter = JSON.parse(filterJson);
      if (filter) {
        for (const [key, value] of Object.entries(filter)) {
          query = query.eq(key, value as string | number | boolean);
        }
      }

      // Apply dependent filter
      if (dependColumn && dependValue) {
        if (dependType === "contains") {
          query = query.contains(dependColumn, [dependValue]);
        } else {
          query = query.eq(dependColumn, dependValue);
        }
      }

      query = query.order("name");

      const { data: rows, error: err } = await query;

      if (cancelled) return;

      if (err) {
        setError(err.message);
        setData([]);
      } else {
        setData(rows ?? []);
      }
      setLoading(false);
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [table, systemId, filterJson, dependsOn, dependColumn, dependType, dependValue]);

  return { data, loading, error };
}
