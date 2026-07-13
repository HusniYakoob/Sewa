"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { formatLKR } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export interface PackageOption {
  id: string;
  tier: string;
  name: string;
  price: number;
  price_unit: string;
  description: string;
}

export function PackagePicker({
  serviceId,
  packages,
}: {
  serviceId: string;
  packages: PackageOption[];
}) {
  const standardIdx = packages.findIndex((p) => p.tier === "standard");
  const [selected, setSelected] = useState(packages[standardIdx >= 0 ? standardIdx : 0]?.id);
  const active = packages.find((p) => p.id === selected) ?? packages[0];

  return (
    <>
      <p className="mb-2.5 mt-5 text-[11px] font-extrabold tracking-wide text-muted-foreground">
        CHOOSE A PACKAGE
      </p>
      <div className="flex flex-col gap-2.5">
        {packages.map((p) => {
          const isActive = p.id === selected;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p.id)}
              className={cn(
                "rounded-2xl border-2 p-4 text-left transition",
                isActive ? "border-brand bg-brand-tint" : "border-border bg-surface",
              )}
            >
              <div className="flex items-baseline justify-between">
                <span className="text-[14.5px] font-extrabold capitalize">{p.name}</span>
                <span
                  className={cn(
                    "text-[17px] font-extrabold",
                    isActive ? "text-brand-text" : "text-foreground",
                  )}
                >
                  {formatLKR(p.price)}
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-snug text-muted-foreground">{p.description}</p>
            </button>
          );
        })}
      </div>

      <div className="sticky bottom-0 -mx-[22px] mt-6 flex items-center gap-3.5 border-t border-border bg-background px-[22px] py-4">
        <div>
          <p className="text-[11px] text-muted-foreground">
            Package · <span className="capitalize">{active?.name}</span>
          </p>
          <p className="text-[19px] font-extrabold">{formatLKR(active?.price ?? 0)}</p>
        </div>
        <Link
          href={`/book/${serviceId}?package=${active?.id}`}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-[15.5px] font-extrabold text-white shadow-[0_10px_26px_rgba(131,77,251,.3)] transition active:scale-[.98]"
        >
          Continue
          <Icon name="arrow_forward" className="text-xl" />
        </Link>
      </div>
    </>
  );
}
