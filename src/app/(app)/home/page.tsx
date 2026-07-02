import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import type { Category } from "@/lib/supabase/types";

export default async function HomePage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const { data: catData } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  const categories = (catData ?? []) as Category[];

  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const isSeller = profile?.role === "seller";

  return (
    <div className="px-4 py-6">
      <p className="text-sm text-muted-foreground">
        {greeting()}, {firstName}
      </p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight">
        {isSeller ? "Your work at a glance" : "What do you need done?"}
      </h1>

      {isSeller ? (
        <div className="mt-6 grid grid-cols-2 gap-3">
          <QuickLink href="/services" icon="handyman" label="My services" />
          <QuickLink href="/bookings" icon="event" label="Job requests" />
          <QuickLink href="/earnings" icon="payments" label="Earnings" />
          <QuickLink href="/profile" icon="verified_user" label="Verification" />
        </div>
      ) : (
        <>
          <Link
            href="/browse"
            className="mt-6 flex h-12 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-muted-foreground"
          >
            <Icon name="search" />
            Search for a service
          </Link>

          <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Categories
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {(categories ?? []).map((c) => (
              <QuickLink
                key={c.id}
                href={`/browse?category=${c.slug}`}
                icon={c.icon ?? "category"}
                label={c.name}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link href={href}>
      <Card className="flex h-full flex-col justify-between gap-6 transition-colors hover:bg-surface-muted">
        <Icon name={icon} className="text-2xl" />
        <span className="text-sm font-medium">{label}</span>
      </Card>
    </Link>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
