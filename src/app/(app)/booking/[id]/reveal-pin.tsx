"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/** A PIN the buyer reveals and reads out to the provider. */
export function RevealPin({ label, pin }: { label: string; pin: string }) {
  const [shown, setShown] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setShown((s) => !s)}
      className="flex w-full items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-left"
      aria-label={shown ? `Hide ${label}` : `Reveal ${label}`}
    >
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className={cn(
            "font-mono text-2xl font-bold tracking-[0.3em] tabular-nums transition",
            !shown && "blur-sm select-none",
          )}
        >
          {shown ? pin : "000000"}
        </p>
      </div>
      <Icon name={shown ? "visibility_off" : "visibility"} className="text-muted-foreground" />
    </button>
  );
}
