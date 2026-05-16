import Image from "next/image";
import { cn } from "@/lib/utils";

interface IlluminatedHeadingProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3;
  className?: string;
}

export function IlluminatedHeading({
  children,
  level = 2,
  className,
}: IlluminatedHeadingProps) {
  const sizeClass =
    level === 1 ? "text-4xl sm:text-5xl" : level === 2 ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl";

  const headingClassName = cn(
    "font-heading uppercase tracking-[0.18em] text-gold text-center",
    sizeClass,
    className
  );

  const heading =
    level === 1 ? (
      <h1 className={headingClassName}>{children}</h1>
    ) : level === 2 ? (
      <h2 className={headingClassName}>{children}</h2>
    ) : (
      <h3 className={headingClassName}>{children}</h3>
    );

  return (
    <div className="flex flex-col items-center gap-2">
      {heading}
      <Image
        src="/textures/gold-divider.png"
        alt=""
        width={400}
        height={50}
        data-testid="gold-divider"
        className="h-auto w-48 sm:w-64 opacity-90"
      />
    </div>
  );
}
