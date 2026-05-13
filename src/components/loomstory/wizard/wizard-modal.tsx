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
      <DialogContent size="full" className="max-h-[95vh] overflow-hidden grid-rows-[auto_1fr]">
        {title && (
          <DialogHeader>
            <DialogTitle className="font-heading text-lg text-muted-foreground uppercase tracking-wider text-center">
              {title}
            </DialogTitle>
          </DialogHeader>
        )}
        <div className="overflow-y-auto pr-2 -mr-2">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
