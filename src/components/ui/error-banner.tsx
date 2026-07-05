import React from "react";
import { AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorBannerProps {
  title?: string;
  message?: string;
  details?: Record<string, any> | null;
  onClose?: () => void;
  className?: string;
}

export function ErrorBanner({
  title = "Validation Error",
  message,
  details,
  onClose,
  className,
}: ErrorBannerProps) {
  if (!message && !details) return null;

  // Flatten Zod formatted errors if available
  const errorsList: string[] = [];
  if (details) {
    Object.entries(details).forEach(([key, value]) => {
      if (key !== "_errors" && value && typeof value === "object" && "_errors" in value) {
        const fieldErrors = (value as any)._errors;
        if (Array.isArray(fieldErrors)) {
          fieldErrors.forEach((err: string) => {
            // Capitalize field name and format message
            const fieldName = key.charAt(0).toUpperCase() + key.slice(1);
            errorsList.push(`${fieldName}: ${err}`);
          });
        }
      }
    });
  }

  return (
    <div
      className={cn(
        "relative w-full rounded-xl border border-destructive/25 bg-destructive/5 dark:bg-destructive/10 p-4 text-destructive backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-2",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 mt-0.5 text-destructive flex-shrink-0" />
        <div className="flex-1 space-y-1">
          <h5 className="font-semibold leading-none tracking-tight text-destructive">
            {title}
          </h5>
          {message && <p className="text-sm opacity-90">{message}</p>}
          {errorsList.length > 0 && (
            <ul className="text-xs list-disc list-inside mt-2 space-y-1 opacity-90">
              {errorsList.map((err, idx) => (
                <li key={idx}>
                  {err}
                </li>
              ))}
            </ul>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-destructive/70 hover:text-destructive p-1 rounded-md transition-colors hover:bg-destructive/10"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
