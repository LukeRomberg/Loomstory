"use client";

import { useTransitionRouter } from "@/hooks/use-transition-router";
import { ChevronLeft } from "lucide-react";

interface BreadcrumbProps {
  href: string;
  label: string;
  suffix?: string;
}

export function Breadcrumb({ href, label, suffix }: BreadcrumbProps) {
  const router = useTransitionRouter();

  return (
    <button
      onClick={() => router.push(href)}
      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
    >
      <ChevronLeft className="size-4" />
      {label}
      {suffix && <span> — {suffix}</span>}
    </button>
  );
}
