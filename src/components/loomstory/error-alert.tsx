import { AlertTriangle } from "lucide-react";

interface ErrorAlertProps {
  message: string;
  className?: string;
}

export function ErrorAlert({ message, className = "" }: ErrorAlertProps) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-2 px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-red-400 text-sm ${className}`}
    >
      <AlertTriangle className="size-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}
