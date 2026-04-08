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
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ds = stepConfig?.dataSource;
  const table = ds?.table;
  const filter = ds?.filter;
  const dependColumn = ds?.dependColumn;

  useEffect(() => {
    if (!table || !systemId) return;

    // If step depends on a parent value and it's not set yet, don't fetch
    if (ds?.dependsOn && !dependValue) {
      setData([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    async function fetchData() {
      const supabase = createClient();
      let query = supabase.from(table!).select("*").eq("system_id", systemId!);

      // Apply static filters
      if (filter) {
        for (const [key, value] of Object.entries(filter)) {
          query = query.eq(key, value);
        }
      }

      // Apply dependent filter
      if (dependColumn && dependValue) {
        query = query.eq(dependColumn, dependValue);
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
  }, [table, systemId, JSON.stringify(filter), dependColumn, dependValue]);

  return { data, loading, error };
}
