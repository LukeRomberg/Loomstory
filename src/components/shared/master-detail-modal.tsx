"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  renderFilters?: () => React.ReactNode;
  searchPlaceholder?: string;
  getSearchableText?: (item: T) => string;
  initialSelectedId?: string;
}

function defaultSearchableText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(defaultSearchableText).join(" ");
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map(defaultSearchableText)
      .join(" ");
  }
  return "";
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
  renderFilters,
  searchPlaceholder,
  getSearchableText,
  initialSelectedId,
}: MasterDetailModalProps<T>) {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId ?? null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (initialSelectedId !== undefined) setSelectedId(initialSelectedId);
  }, [initialSelectedId]);

  const filteredItems = useMemo(() => {
    if (!searchPlaceholder || !search.trim()) return items;
    const query = search.trim().toLowerCase();
    const toText = getSearchableText ?? defaultSearchableText;
    return items.filter((item) => toText(item).toLowerCase().includes(query));
  }, [items, search, searchPlaceholder, getSearchableText]);

  const selectedItem = items.find((i) => i.id === selectedId) ?? null;
  const hasSearch = Boolean(searchPlaceholder);
  const isFiltering = hasSearch && search.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="full" className="h-[90vh] p-0 gap-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border flex-row items-center gap-4">
          <DialogTitle className="font-heading text-lg shrink-0">{title}</DialogTitle>
          {hasSearch && (
            <div className="flex-1 flex justify-center">
              <Input
                type="search"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
          )}
          {onCreateClick && createLabel && (
            <Button
              size="sm"
              className={`gold-glow font-heading mr-8 shrink-0${hasSearch ? "" : " ml-auto"}`}
              onClick={onCreateClick}
            >
              <Plus className="size-4 mr-1" />
              {createLabel}
            </Button>
          )}
        </DialogHeader>

        {/* Filters */}
        {renderFilters && (
          <div className="px-6 py-3 border-b border-border">
            {renderFilters()}
          </div>
        )}

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
            ) : filteredItems.length === 0 && isFiltering ? (
              <div className="flex items-center justify-center h-full text-muted-foreground font-lore text-sm">
                No results found.
              </div>
            ) : (
              <div className="space-y-1">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`cursor-pointer rounded-lg p-3 transition-colors ${
                      item.id === selectedId
                        ? "bg-gold/10 ring-1 ring-gold/30"
                        : "bg-leather hover:bg-leather/80"
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
