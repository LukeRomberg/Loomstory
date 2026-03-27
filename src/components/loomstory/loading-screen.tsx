import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  layout?: "full" | "panel";
}

export function LoadingScreen({ layout = "panel" }: LoadingScreenProps) {
  return (
    <div
      className={`flex items-center justify-center ${
        layout === "full" ? "min-h-screen" : "h-full"
      }`}
      role="status"
      aria-label="Loading"
    >
      <Loader2 className="size-5 text-gold animate-spin" />
    </div>
  );
}
