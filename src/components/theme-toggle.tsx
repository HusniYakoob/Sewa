"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/**
 * Segmented Light / Dark control for the Settings screen.
 * Renders nothing until mounted to avoid a hydration mismatch.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const options = [
    { value: "light", label: "Light", icon: "light_mode" },
    { value: "dark", label: "Dark", icon: "dark_mode" },
    { value: "system", label: "Auto", icon: "contrast" },
  ] as const;

  return (
    <div className="flex rounded-2xl bg-surface-muted p-1">
      {options.map((opt) => {
        const active = mounted && theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            aria-pressed={active}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-[13px] py-2.5 text-[13px] font-bold transition-colors",
              active ? "bg-brand text-white shadow-sm font-extrabold" : "text-muted-foreground",
            )}
          >
            <Icon name={opt.icon} filled={active} className="text-[17px]" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
