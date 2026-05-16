import Image from "next/image";
import { cn } from "@/lib/utils";

interface ParchmentSheetProps {
  children: React.ReactNode;
  ornate?: boolean;
  className?: string;
}

const CORNERS = [
  { position: "top-3 left-3", rotation: "rotate-0" },
  { position: "top-3 right-3", rotation: "rotate-90" },
  { position: "bottom-3 right-3", rotation: "rotate-180" },
  { position: "bottom-3 left-3", rotation: "-rotate-90" },
] as const;

export function ParchmentSheet({
  children,
  ornate = false,
  className,
}: ParchmentSheetProps) {
  return (
    <div
      className={cn(
        "parchment relative rounded-lg p-8",
        ornate && "px-12 py-10",
        className
      )}
    >
      {ornate &&
        CORNERS.map((c, i) => (
          <div
            key={i}
            data-testid="parchment-corner"
            className={cn(
              "pointer-events-none absolute size-20",
              c.position,
              c.rotation
            )}
          >
            <Image
              src="/textures/ornate-corner.png"
              alt=""
              width={120}
              height={120}
              className="h-full w-full object-contain opacity-90"
            />
          </div>
        ))}
      {children}
    </div>
  );
}
