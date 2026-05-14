"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WizardModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function WizardModal({ open, onClose, title, children }: WizardModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent size="full" className="h-[95vh] overflow-hidden flex flex-col">
        {title && (
          <DialogHeader className="shrink-0">
            <DialogTitle className="font-heading text-sm text-muted-foreground uppercase tracking-wider text-center">
              {title}
            </DialogTitle>
          </DialogHeader>
        )}
        {/* `relative` so HelpPopup (absolute inset-0) overlays this region */}
        <div className="flex-1 min-h-0 flex flex-col relative">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
