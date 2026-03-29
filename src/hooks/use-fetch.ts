"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

interface FetchOptions {
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
}

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: <R = T>(
    fn: () => Promise<R>,
    options?: FetchOptions
  ) => Promise<R | undefined>;
}

export function useFetch<T = unknown>(): FetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async <R = T>(
      fn: () => Promise<R>,
      options?: FetchOptions
    ): Promise<R | undefined> => {
      setLoading(true);
      setError(null);

      let toastId: string | number | undefined;
      if (options?.loadingMessage) {
        toastId = toast.loading(options.loadingMessage);
      }

      try {
        const result = await fn();
        setData(result as unknown as T);

        if (toastId) toast.dismiss(toastId);
        if (options?.successMessage) {
          toast.success(options.successMessage);
        }

        setLoading(false);
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setError(message);

        if (toastId) toast.dismiss(toastId);
        toast.error(options?.errorMessage ?? "Something went wrong", {
          description: message,
        });

        setLoading(false);
        return undefined;
      }
    },
    []
  );

  return { data, loading, error, execute };
}
