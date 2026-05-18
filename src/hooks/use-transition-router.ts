"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useTransition } from "react";
import {
  startNavigation,
  endNavigation,
} from "@/lib/navigation-state";

// Drop-in replacement for useRouter()'s push/replace that wraps the
// navigation in a React transition AND registers it with the global
// navigation state so the candle-flicker overlay renders while pending.
export function useTransitionRouter() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isPending) return;
    startNavigation();
    return () => endNavigation();
  }, [isPending]);

  return useMemo(
    () => ({
      push(href: string) {
        startTransition(() => router.push(href));
      },
      replace(href: string) {
        startTransition(() => router.replace(href));
      },
      refresh() {
        router.refresh();
      },
      isPending,
    }),
    [router, isPending],
  );
}
