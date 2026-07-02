"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/supabase/types";

type Tab = { href: string; label: string; icon: string };

const BUYER_TABS: Tab[] = [
  { href: "/home", label: "Home", icon: "home" },
  { href: "/browse", label: "Browse", icon: "search" },
  { href: "/bookings", label: "Bookings", icon: "event" },
  { href: "/profile", label: "Profile", icon: "person" },
];

const SELLER_TABS: Tab[] = [
  { href: "/home", label: "Home", icon: "home" },
  { href: "/services", label: "Services", icon: "handyman" },
  { href: "/bookings", label: "Jobs", icon: "event" },
  { href: "/earnings", label: "Earnings", icon: "payments" },
  { href: "/profile", label: "Profile", icon: "person" },
];

export function BottomNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const tabs = role === "seller" ? SELLER_TABS : BUYER_TABS;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <Icon name={tab.icon} filled={active} className="text-2xl" />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
