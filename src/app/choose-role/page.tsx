"use client";

import { useState } from "react";
import Link from "next/link";
import { completeRoleChoice } from "../(auth)/actions";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const ROLES = [
  {
    value: "buyer" as const,
    icon: "search",
    title: "Book a service",
    subtitle: "Find and hire trusted, verified pros nearby.",
  },
  {
    value: "seller" as const,
    icon: "handyman",
    title: "Offer my services",
    subtitle: "List your gigs and start earning on Sewa.",
  },
];

export default function ChooseRolePage() {
  const [role, setRole] = useState<"buyer" | "seller">("buyer");

  return (
    <main className="flex min-h-dvh flex-col bg-background px-6 pt-3">
      <Link
        href="/verify-phone"
        aria-label="Back"
        className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-border bg-surface"
      >
        <Icon name="arrow_back" />
      </Link>

      <div className="flex-1 pt-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-brand-tint text-sm font-extrabold text-brand-text">
            Hi
          </span>
          <span className="text-sm font-bold text-muted-foreground">Welcome to Sewa 👋</span>
        </div>

        <h1 className="mt-4 text-[27px] font-extrabold tracking-tight">
          How will you use Sewa?
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Pick one to get started — you can switch anytime from your profile.
        </p>

        <div className="mt-6 flex flex-col gap-3.5">
          {ROLES.map((r) => {
            const active = role === r.value;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-3.5 rounded-[20px] border-2 p-5 text-left transition active:scale-[.99]",
                  active
                    ? "border-brand bg-brand-tint shadow-[0_8px_20px_-10px_rgba(131,77,251,.5)]"
                    : "border-border bg-surface",
                )}
              >
                <span
                  className={cn(
                    "flex h-[54px] w-[54px] flex-none items-center justify-center rounded-2xl",
                    active ? "bg-brand text-white" : "bg-surface-muted text-brand-text",
                  )}
                >
                  <Icon name={r.icon} filled className="text-[27px]" />
                </span>
                <div className="flex-1">
                  <div className="text-[16.5px] font-extrabold">{r.title}</div>
                  <div className="mt-0.5 text-[12.5px] leading-tight text-muted-foreground">
                    {r.subtitle}
                  </div>
                </div>
                <span
                  className={cn(
                    "flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full border-2",
                    active ? "border-brand bg-brand" : "border-border bg-transparent",
                  )}
                >
                  {active ? <Icon name="check" className="text-[17px] text-white" /> : null}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex items-start gap-2.5 px-1">
          <Icon name="shield" filled className="mt-0.5 text-[17px] text-brand-text" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Pros complete a quick NIC verification. Every booking is covered by the{" "}
            <b className="text-foreground">Sewa Guarantee</b>.
          </p>
        </div>
      </div>

      <form action={completeRoleChoice} className="pb-8 pt-4">
        <input type="hidden" name="role" value={role} />
        <button
          type="submit"
          className="flex w-full items-center justify-center rounded-2xl bg-brand py-4 text-[15.5px] font-extrabold text-white shadow-[0_10px_26px_rgba(131,77,251,.3)] transition active:scale-[.98]"
        >
          Continue as {role}
        </button>
      </form>
    </main>
  );
}
