"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface HelpPopupProps {
  open: boolean;
  onClose: () => void;
  title: string;
  helpText: string;
  /** Seconds the "Got it" button stays disabled when the popup opens. Default 3. */
  countdownSeconds?: number;
}

/**
 * Overlay that appears centered over the wizard step content with backdrop blur.
 * The "Got it" button is disabled for `countdownSeconds` after the popup opens so
 * players can't auto-click through the hand-holding. Only the button closes the
 * popup (no backdrop click, no escape key) — by design, this is the "stop and
 * read" beat.
 *
 * Positioned with `absolute inset-0` so it requires a positioned ancestor — the
 * wizard-modal's children container provides that via `relative`.
 */
export function HelpPopup({
  open,
  onClose,
  title,
  helpText,
  countdownSeconds = 3,
}: HelpPopupProps) {
  const [countdown, setCountdown] = useState(countdownSeconds);

  useEffect(() => {
    if (!open) {
      setCountdown(countdownSeconds);
      return;
    }
    setCountdown(countdownSeconds);
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(id);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [open, countdownSeconds]);

  if (!open) return null;

  return (
    <div
      data-testid="help-popup"
      className="absolute inset-0 z-50 flex items-center justify-center px-4"
    >
      {/* Backdrop — captures clicks so the content below is unreachable */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Popup card */}
      <div className="relative z-10 w-full max-w-lg rounded-xl border-2 border-gold/60 bg-card p-6 shadow-2xl">
        <h3 className="font-heading text-2xl text-gold mb-3">{title}</h3>
        <p className="text-base text-muted-foreground font-lore leading-relaxed mb-6 whitespace-pre-line">
          {helpText}
        </p>
        <Button
          type="button"
          onClick={onClose}
          disabled={countdown > 0}
          className="w-full font-heading text-lg"
        >
          {countdown > 0 ? `Got it (${countdown}s)` : "Got it"}
        </Button>
      </div>
    </div>
  );
}
