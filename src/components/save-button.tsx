"use client";

import { useState, useTransition } from "react";
import { toggleSaved } from "@/app/(app)/saved/actions";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export function SaveButton({
  serviceId,
  initialSaved,
  variant = "overlay",
}: {
  serviceId: string;
  initialSaved: boolean;
  variant?: "overlay" | "solid" | "hero";
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from saved" : "Save service"}
      aria-pressed={saved}
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const next = !saved;
        setSaved(next);
        startTransition(async () => {
          const res = await toggleSaved(serviceId, saved);
          if (res.error) setSaved(!next);
        });
      }}
      className={cn(
        "flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full transition active:scale-90",
        variant === "overlay" && "bg-white/25 backdrop-blur-sm",
        variant === "hero" && "h-[38px] w-[38px] bg-white/85 backdrop-blur-sm dark:bg-[#26273A]/85",
        variant === "solid" && (saved ? "bg-danger/10" : "bg-surface-muted"),
      )}
    >
      <Icon
        name={saved ? "favorite" : "favorite_border"}
        filled={saved}
        className={cn(
          "text-[18px]",
          saved
            ? "text-danger"
            : variant === "overlay"
              ? "text-white"
              : variant === "hero"
                ? "text-foreground"
                : "text-muted-foreground",
        )}
      />
    </button>
  );
}
