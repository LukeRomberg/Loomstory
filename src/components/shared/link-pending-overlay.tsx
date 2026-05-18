"use client";

import { useEffect } from "react";
import { useLinkStatus } from "next/link";
import {
  startNavigation,
  endNavigation,
} from "@/lib/navigation-state";

// Drop inside any <Link> to register that link's pending state with the
// global navigation overlay (rendered once in the (protected) layout).
// Renders nothing itself.
export function LinkPendingOverlay() {
  const { pending } = useLinkStatus();

  useEffect(() => {
    if (!pending) return;
    startNavigation();
    return () => endNavigation();
  }, [pending]);

  return null;
}
