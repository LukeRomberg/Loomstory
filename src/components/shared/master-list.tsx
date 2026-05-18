"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { EyeOff } from "lucide-react";

interface MasterListProps {
  title: string;
  count: number;
  search: string;
  onSearchChange: (value: string) => void;
  isEmpty?: boolean;
  emptyMessage?: string;
  children?: React.ReactNode;
}

// Left-page master list for the OpenBookView. Renders the title + count
// + search header and a scrollable body. Pass <MasterListItem> children.
export function MasterList({
  title,
  count,
  search,
  onSearchChange,
  isEmpty,
  emptyMessage,
  children,
}: MasterListProps) {
  return (
    <>
      <div className="flex shrink-0 items-center gap-2">
        <h2 className="mr-auto font-heading text-base uppercase tracking-[0.15em] text-leather sm:text-lg">
          {title}{" "}
          <span className="ml-1 font-sans text-xs font-normal text-leather/65 sm:text-sm">
            ({count})
          </span>
        </h2>
        <Input
          placeholder="Search…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 w-40 border-leather/30 bg-parchment/30 text-xs text-leather placeholder:text-leather/40"
        />
      </div>

      <div className="scrollbar-none flex-1 overflow-y-auto pr-1">
        {isEmpty ? (
          <div className="flex h-full items-center justify-center text-center text-xs italic text-leather/60">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-1.5">{children}</div>
        )}
      </div>
    </>
  );
}

interface MasterListItemProps {
  selected?: boolean;
  onClick: () => void;
  title: string;
  subtitle?: React.ReactNode;
  hidden?: boolean;
}

export function MasterListItem({
  selected,
  onClick,
  title,
  subtitle,
  hidden,
}: MasterListItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded border border-leather/15 px-3 py-2 text-left transition",
        "hover:bg-leather/5",
        selected && "border-leather/40 bg-leather/10"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="line-clamp-1 font-heading text-sm text-leather">
          {title}
        </div>
        {hidden && (
          <EyeOff className="size-3.5 shrink-0 text-leather/70" />
        )}
      </div>
      {subtitle && (
        <div className="mt-0.5 line-clamp-1 text-xs font-semibold uppercase tracking-[0.08em] text-leather/70">
          {subtitle}
        </div>
      )}
    </button>
  );
}
