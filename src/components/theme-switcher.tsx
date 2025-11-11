"use client";

import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Card } from "./ui/card";

const themes = [
  { 
    name: "Light", 
    value: "light",
    description: "Default light theme.",
  },
  { 
    name: "Dark", 
    value: "dark",
    description: "Default dark theme.",
  },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
      {themes.map((t) => {
        const isActive = theme === t.value;
        return (
          <button
            key={t.value}
            className={cn(
              "p-4 rounded-lg border-2 text-left relative transition-all",
              isActive ? "border-primary shadow-lg" : "border-border hover:border-primary/50"
            )}
            onClick={() => setTheme(t.value)}
            aria-pressed={isActive}
          >
            {isActive && <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-4 w-4" />
            </div>}
            <span className="font-semibold text-base font-headline">{t.name}</span>
            <p className="mt-1 text-sm text-muted-foreground">
                {t.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
