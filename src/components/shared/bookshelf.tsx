import { cn } from "@/lib/utils";

interface BookshelfProps {
  campaignName: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function Bookshelf({
  campaignName,
  subtitle,
  children,
  className,
}: BookshelfProps) {
  return (
    <section className={cn("relative", className)}>
      <header className="mb-4 flex flex-col items-center text-center">
        <h2 className="embossed-gold font-heading text-xl uppercase tracking-[0.18em] sm:text-2xl">
          {campaignName}
        </h2>
        {subtitle && (
          <p
            data-testid="bookshelf-subtitle"
            className="mt-1 font-subheading text-xs tracking-[0.16em] text-gold/70 uppercase"
          >
            {subtitle}
          </p>
        )}
      </header>
      <div
        data-testid="bookshelf-surface"
        className="leather-bg relative rounded-md border-2 border-brass/40 px-4 pb-6 pt-6 shadow-[inset_0_6px_18px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.35)]"
      >
        <div className="flex flex-wrap items-end justify-center gap-3">
          {children}
        </div>
        <div className="pointer-events-none absolute inset-x-2 bottom-0 h-2 rounded-b-md bg-gradient-to-b from-transparent to-black/40" />
      </div>
    </section>
  );
}
