import { cn } from "@/lib/utils";

interface LibraryProps {
  children: React.ReactNode;
  className?: string;
}

export function Library({ children, className }: LibraryProps) {
  return (
    <div
      className={cn(
        "wood relative rounded-lg border-2 border-brass/30 px-4 py-10 shadow-2xl shadow-black/40 sm:px-8",
        className
      )}
    >
      <div className="flex flex-col gap-12">{children}</div>
    </div>
  );
}
