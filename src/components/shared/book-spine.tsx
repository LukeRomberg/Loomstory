import Link from "next/link";
import { Lock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type BookColor = "mahogany" | "deep-brown" | "ink-blue" | "forest";

interface BookSpineCommonProps {
  title: string;
  subtitle?: string;
  color: BookColor;
  emblem: LucideIcon;
  gmOnly?: boolean;
  className?: string;
}

type BookSpineProps =
  | (BookSpineCommonProps & { onClick: () => void; href?: never })
  | (BookSpineCommonProps & { href: string; onClick?: never });

const COLOR_CLASSES: Record<BookColor, string> = {
  mahogany: "bg-void",
  "deep-brown": "bg-leather",
  "ink-blue": "bg-ink-blue",
  forest: "bg-forest",
};

export function BookSpine(props: BookSpineProps) {
  const { title, subtitle, color, emblem: Emblem, gmOnly, className } = props;

  const content = (
    <>
      <Emblem
        data-testid="book-emblem"
        className="size-10 text-gold/90"
        aria-hidden="true"
      />
      <div className="mt-auto flex flex-col items-center text-center">
        <span className="embossed-gold font-heading text-[10px] sm:text-xs leading-tight px-1">
          {title}
        </span>
        {subtitle && (
          <span
            data-testid="book-subtitle"
            className="mt-1 text-[9px] text-gold/70"
          >
            {subtitle}
          </span>
        )}
      </div>
      {gmOnly && (
        <span
          data-testid="book-gm-only"
          aria-label="GM only"
          className="absolute top-1.5 right-1.5 rounded-full bg-leather/80 p-1 text-gold/80"
        >
          <Lock className="size-3" aria-hidden="true" />
        </span>
      )}
    </>
  );

  const sharedClassName = cn(
    "group/spine relative flex h-44 w-28 flex-col items-center gap-3 rounded-md border-2 border-brass/40 p-3 pt-4 shadow-lg shadow-black/40 transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl",
    COLOR_CLASSES[color],
    className
  );

  if ("href" in props && props.href) {
    return (
      <Link
        href={props.href}
        data-testid="book-spine"
        className={sharedClassName}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={props.onClick}
      data-testid="book-spine"
      className={sharedClassName}
    >
      {content}
    </button>
  );
}
