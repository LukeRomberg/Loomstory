"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  getIsNavigating,
  subscribeNavigation,
} from "@/lib/navigation-state";
import { LoadingScreen } from "@/components/loomstory/loading-screen";

export function GlobalNavigationOverlay() {
  const navigating = useSyncExternalStore(
    subscribeNavigation,
    getIsNavigating,
    () => false,
  );

  if (!navigating || typeof document === "undefined") return null;
  return createPortal(<LoadingScreen layout="full" />, document.body);
}
