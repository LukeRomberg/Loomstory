"use client";

import { useEffect, useCallback } from "react";
import { X } from "lucide-react";

interface WizardModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function WizardModal({ open, onClose, title, children }: WizardModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKeyDown);
    // Prevent body scrolling while modal is open
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-void flex items-start justify-center p-6 overflow-y-auto">
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close"
        className="fixed top-4 right-4 z-50 size-8 rounded-full border border-rune/40 bg-black/40 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-rune transition-colors"
      >
        <X className="size-4" />
      </button>

      <div className="w-full max-w-2xl my-auto py-8">
        {title && (
          <h1 className="font-heading text-sm text-muted-foreground uppercase tracking-wider text-center mb-2">
            {title}
          </h1>
        )}
        {children}
      </div>
    </div>
  );
}
