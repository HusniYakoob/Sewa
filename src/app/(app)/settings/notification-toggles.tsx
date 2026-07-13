"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const TOGGLES = [
  { key: "bookings", icon: "event_available", name: "Booking updates", desc: "Confirmations, reschedules, cancellations" },
  { key: "messages", icon: "chat", name: "New messages", desc: "Chat from buyers and sellers" },
  { key: "promo", icon: "campaign", name: "Offers & tips", desc: "Occasional promos from Sewa" },
] as const;

/**
 * UI-only — no push infrastructure is wired up yet, so these don't persist
 * or trigger real notifications. Kept local so the screen still feels alive.
 */
export function NotificationToggles() {
  const [state, setState] = useState<Record<string, boolean>>({
    bookings: true,
    messages: true,
    promo: false,
  });

  return (
    <div className="overflow-hidden rounded-2xl border-[1.5px] border-border bg-surface">
      {TOGGLES.map((t) => {
        const on = state[t.key];
        return (
          <div
            key={t.key}
            className="flex items-center gap-3.5 border-b border-border p-4 last:border-b-0"
          >
            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-surface-muted">
              <Icon name={t.icon} className="text-[19px] text-brand-text" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold">{t.name}</p>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">{t.desc}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={on}
              onClick={() => setState((s) => ({ ...s, [t.key]: !s[t.key] }))}
              className={cn(
                "relative h-7 w-12 flex-none rounded-full transition-colors",
                on ? "bg-brand" : "bg-surface-muted",
              )}
            >
              <span
                className={cn(
                  "absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition-all",
                  on ? "left-[23px]" : "left-[3px]",
                )}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}
