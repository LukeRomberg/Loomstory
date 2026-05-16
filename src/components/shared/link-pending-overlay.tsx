"use client";

import { useLinkStatus } from "next/link";
import { createPortal } from "react-dom";
import { LoadingScreen } from "@/components/loomstory/loading-screen";

// Drop inside any <Link> to render the candle-flicker overlay on top of the
// current page while that link's navigation is pending. Uses a portal so the
// overlay covers the viewport rather than being clipped by the Link's box.
export function LinkPendingOverlay() {
  const { pending } = useLinkStatus();
  if (!pending || typeof document === "undefined") return null;
  return createPortal(<LoadingScreen layout="full" />, document.body);
}
