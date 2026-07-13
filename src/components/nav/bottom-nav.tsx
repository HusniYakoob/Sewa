"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type Tab = { href: string; label: string; icon: string };

const BUYER_TABS: Tab[] = [
  { href: "/home", label: "Home", icon: "home" },
  { href: "/categories", label: "Services", icon: "grid_view" },
  { href: "/bookings", label: "Bookings", icon: "event" },
  { href: "/chats", label: "Chat", icon: "chat_bubble" },
  { href: "/account", label: "Account", icon: "person" },
];

const SELLER_TABS: Tab[] = [
  { href: "/home", label: "Dashboard", icon: "space_dashboard" },
  { href: "/services", label: "My Ads", icon: "campaign" },
  { href: "/bookings", label: "Jobs", icon: "event" },
  { href: "/earnings", label: "Wallet", icon: "account_balance_wallet" },
  { href: "/account", label: "Account", icon: "person" },
];

/**
 * Floating pill nav — a rounded bar overlapping the content, active tab
 * expands to show its label. Buyer vs. seller tabs follow the account's
 * current context (the Buying<->Selling toggle), not the fixed role.
 */
export function BottomNav({ context }: { context: "buyer" | "seller" }) {
  const pathname = usePathname();
  const tabs = context === "seller" ? SELLER_TABS : BUYER_TABS;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(12px+env(safe-area-inset-bottom))]">
      <ul className="mx-auto flex max-w-md items-center gap-1 rounded-full border border-border bg-surface p-[7px] shadow-[0_12px_30px_rgba(131,77,251,.18)] dark:shadow-[0_12px_30px_rgba(0,0,0,.45)]">
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <li key={tab.href} className={cn("flex", active ? "flex-[1.6]" : "flex-1")}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-11 w-full items-center justify-center gap-1.5 rounded-full transition-all",
                  active ? "bg-brand text-white" : "text-muted-foreground",
                )}
              >
                <Icon name={tab.icon} filled={active} className="text-[22px]" />
                {active ? <span className="text-[13px] font-extrabold">{tab.label}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
