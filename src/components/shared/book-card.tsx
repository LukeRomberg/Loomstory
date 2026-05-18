import * as React from "react";
import { cn } from "@/lib/utils";

// Parchment-toned card that reads as dark brown on the open-book page.
// Use in place of <Card> whenever a card appears inside the OpenBookView.

export function BookCard({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="book-card"
      className={cn(
        "grain flex flex-col gap-3 overflow-hidden rounded-md border border-leather/30 bg-parchment/40 py-3 text-sm text-leather",
        className
      )}
      {...props}
    />
  );
}

export function BookCardHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="book-card-header"
      className={cn("px-3", className)}
      {...props}
    />
  );
}

export function BookCardTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="book-card-title"
      className={cn(
        "font-heading text-sm uppercase tracking-wider text-leather",
        className
      )}
      {...props}
    />
  );
}

export function BookCardContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="book-card-content"
      className={cn("px-3 text-leather", className)}
      {...props}
    />
  );
}
