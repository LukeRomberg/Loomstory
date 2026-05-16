import Image from "next/image";

interface LoadingScreenProps {
  layout?: "full" | "panel";
  label?: string;
}

export function LoadingScreen({
  layout = "panel",
  label = "Loading...",
}: LoadingScreenProps) {
  const containerClass =
    layout === "full"
      ? "fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-background/60"
      : "flex h-full min-h-[240px] w-full flex-col items-center justify-center gap-5 rounded-lg bg-background/70 backdrop-blur-sm";

  return (
    <div role="status" aria-label={label} className={containerClass}>
      <div className="animate-candle-flicker">
        <Image
          src="/brand/loomstory-monogram.svg"
          alt=""
          width={96}
          height={96}
          priority
          unoptimized
          className="h-20 w-auto"
        />
      </div>
      <p className="font-lore italic text-gold tracking-wider text-base">
        {label}
      </p>
    </div>
  );
}
