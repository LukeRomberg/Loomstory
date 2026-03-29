"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, ChevronsRight } from "lucide-react";

interface MasterDetailModalProps<T extends { id: string }> {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: T[];
  loading: boolean;
  renderListItem: (item: T, isSelected: boolean) => React.ReactNode;
  renderDetail: (item: T) => React.ReactNode;
  onCreateClick?: () => void;
  createLabel?: string;
  emptyMessage?: string;
}

export function MasterDetailModal<T extends { id: string }>({
  title,
  open,
  onOpenChange,
  items,
  loading,
  renderListItem,
  renderDetail,
  onCreateClick,
  createLabel,
  emptyMessage = "No items yet.",
}: MasterDetailModalProps<T>) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedItem = items.find((i) => i.id === selectedId) ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh] p-0 gap-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border flex-row items-center justify-between">
          <DialogTitle className="font-heading text-lg">{title}</DialogTitle>
          {onCreateClick && createLabel && (
            <Button
              size="sm"
              className="gold-glow font-heading"
              onClick={onCreateClick}
            >
              <Plus className="size-4 mr-1" />
              {createLabel}
            </Button>
          )}
        </DialogHeader>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* List Panel */}
          <div
            className={`${
              selectedItem ? "w-2/5 border-r border-border" : "w-full"
            } overflow-y-auto p-4 transition-all`}
          >
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-2 p-3 rounded-lg bg-muted/30">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground font-lore text-sm">
                {emptyMessage}
              </div>
            ) : (
              <div className="space-y-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`cursor-pointer rounded-lg p-3 transition-colors ${
                      item.id === selectedId
                        ? "bg-gold/10 ring-1 ring-gold/30"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    {renderListItem(item, item.id === selectedId)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selectedItem && (
            <div className="w-3/5 overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSelectedId(null)}
                  aria-label="Close detail"
                >
                  <ChevronsRight className="size-4" />
                </Button>
              </div>
              {renderDetail(selectedItem)}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
