import Link from "next/link";
import { getCurrentProfile, getCurrentSellerProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { formatLKR } from "@/lib/pricing";
import type { BookingStatus } from "@/lib/supabase/types";

export default async function HomePage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const isSeller = profile?.role === "seller";
  const firstName = profile?.full_name?.split(" ")[0] || "there";

  if (isSeller) {
    return (
      <SellerHome
        firstName={firstName}
        name={profile?.full_name ?? null}
        avatarUrl={profile?.avatar_url ?? null}
      />
    );
  }

  const { data: catData } = await supabase
    .from("categories")
    .select("id, name, slug, icon")
    .eq("is_active", true)
    .order("sort_order")
    .limit(8);
  const categories = (catData ?? []) as {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  }[];

  const { data: activeRow } = await supabase
    .from("bookings")
    .select("id, status, service:services(title)")
    .eq("buyer_id", profile?.id ?? "")
    .in("status", ["in_progress", "arrived"])
    .order("scheduled_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const active = activeRow as unknown as {
    id: string;
    status: BookingStatus;
    service: { title: string } | null;
  } | null;

  const { data: upRow } = await supabase
    .from("bookings")
    .select("id, scheduled_at, service:services(title)")
    .eq("buyer_id", profile?.id ?? "")
    .eq("status", "accepted")
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const upcoming = upRow as unknown as {
    id: string;
    scheduled_at: string;
    service: { title: string } | null;
  } | null;

  const { data: topData } = await supabase
    .from("services")
    .select("id, title, price, rating, category:categories(name)")
    .eq("status", "active")
    .order("rating", { ascending: false })
    .limit(3);
  const top = (topData ?? []) as unknown as {
    id: string;
    title: string;
    price: number;
    rating: number;
    category: { name: string } | null;
  }[];

  return (
    <div>
      {/* Gradient hero */}
      <div className="bg-[linear-gradient(135deg,#834dfb,#6b2fe0)] dark:bg-[linear-gradient(135deg,#834dfb,#5b27c9)] relative overflow-hidden rounded-b-[30px] pb-8 text-white">
        <div className="absolute -right-12 top-2 h-44 w-44 rounded-full bg-white/[.09]" />
        <div className="absolute right-8 top-24 h-14 w-14 rounded-full bg-accent/90" />
        <div className="relative px-[22px] pt-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 py-2 pl-2.5 pr-3 text-[13px] font-bold">
              <Icon name="location_on" filled className="text-base" /> Nugegoda
            </span>
            <Link href="/profile">
              <Avatar
                avatarUrl={profile?.avatar_url}
                name={profile?.full_name}
                size="sm"
                className="h-[38px] w-[38px] bg-white text-[13px] text-brand"
              />
            </Link>
          </div>
          <h1 className="mt-5 text-[30px] font-extrabold leading-[1.08] tracking-tight">
            Let&rsquo;s get it done,
            <br />
            <span className="text-accent">{firstName}.</span>
          </h1>
          <div className="mt-4 flex gap-2.5">
            <Link
              href="/browse"
              className="flex flex-1 items-center gap-2.5 rounded-[15px] bg-white px-4 py-3.5 shadow-[0_10px_26px_rgba(60,20,120,.28)]"
            >
              <Icon name="search" className="text-xl text-brand" />
              <span className="text-sm text-muted-foreground">
                Search services or pros
              </span>
            </Link>
            <span className="flex h-[52px] w-[52px] items-center justify-center rounded-[15px] bg-accent shadow-[0_10px_26px_rgba(60,20,120,.28)]">
              <Icon name="tune" className="text-[23px] text-accent-foreground" />
            </span>
          </div>
        </div>
      </div>

      {/* Active job (overlaps hero) */}
      {active ? (
        <div className="-mt-[18px] px-[22px]">
          <Link
            href={`/booking/${active.id}`}
            className="flex items-center gap-3 rounded-[20px] bg-[#1B1C2B] p-4 shadow-[0_16px_30px_rgba(27,28,43,.25)]"
          >
            <span className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full bg-brand">
              <Icon name="cleaning_services" filled className="text-xl text-white" />
            </span>
            <div className="flex-1">
              <p className="flex items-center gap-2 text-[13.5px] font-bold text-white">
                {active.service?.title ?? "Service"} in progress
                <span className="h-1.5 w-1.5 rounded-full bg-[#3DDC84]" />
              </p>
              <p className="mt-0.5 text-xs text-[#9A96AB]">Tap to view PINs</p>
            </div>
            <Icon name="chevron_right" className="text-[#6E6A7C]" />
          </Link>
        </div>
      ) : null}

      {/* Categories */}
      <div className={active ? "px-[22px] pt-1.5" : "px-[22px] pt-5"}>
        <div className="flex items-baseline justify-between">
          <h2 className="text-[17px] font-extrabold">Services</h2>
          <Link href="/browse" className="text-[12.5px] font-extrabold text-brand-text">
            See all
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-3">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/browse?category=${c.slug}`}
              className="flex flex-col items-center gap-1.5"
            >
              <span className="flex h-[62px] w-[62px] items-center justify-center rounded-[20px] bg-brand-tint transition active:scale-95">
                <Icon name={c.icon ?? "category"} filled className="text-[26px] text-brand-text" />
              </span>
              <span className="text-[11px] font-bold text-foreground">{c.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Upcoming */}
      {upcoming ? (
        <div className="px-[22px] pt-6">
          <h2 className="text-[17px] font-extrabold">Upcoming</h2>
          <Link
            href={`/booking/${upcoming.id}`}
            className="mt-3 flex items-center gap-3 rounded-[20px] bg-surface p-4 shadow-[0_6px_20px_-12px_rgba(131,77,251,.4)]"
          >
            <span className="h-[50px] w-[50px] flex-none rounded-[15px] bg-brand-tint" />
            <div className="flex-1">
              <p className="text-[14.5px] font-extrabold">
                {upcoming.service?.title ?? "Service"}
              </p>
              <p className="mt-1 flex items-center gap-1 text-[11.5px] font-semibold text-muted-foreground">
                <Icon name="calendar_month" className="text-sm" />
                {new Date(upcoming.scheduled_at).toLocaleString("en-LK", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-tint">
              <Icon name="chevron_right" className="text-brand-text" />
            </span>
          </Link>
        </div>
      ) : null}

      {/* Top rated */}
      <div className="px-[22px] pb-24 pt-6">
        <h2 className="text-[17px] font-extrabold">Top rated near you</h2>
        <div className="mt-3 flex flex-col gap-2.5">
          {top.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              New providers are joining. Check back soon.
            </p>
          ) : (
            top.map((s) => (
              <Link
                key={s.id}
                href={`/service/${s.id}`}
                className="flex items-center gap-3 rounded-2xl bg-surface p-3.5 shadow-[0_4px_14px_-8px_rgba(131,77,251,.4)]"
              >
                <span className="h-12 w-12 flex-none rounded-[14px] bg-brand-tint" />
                <div className="flex-1">
                  <p className="text-sm font-extrabold">{s.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {s.category?.name} · {formatLKR(s.price)}
                  </p>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-brand-tint px-2.5 py-1.5">
                  <Icon name="star" filled className="text-sm text-[#EAB308]" />
                  <span className="text-xs font-extrabold">
                    {(s.rating ?? 0).toFixed(1)}
                  </span>
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

async function SellerHome({
  firstName,
  name,
  avatarUrl,
}: {
  firstName: string;
  name: string | null;
  avatarUrl: string | null;
}) {
  const seller = await getCurrentSellerProfile();
  const profileIncomplete =
    !seller?.description?.trim() || (seller?.service_areas?.length ?? 0) === 0;

  const links = [
    { href: "/services", icon: "handyman", label: "My services" },
    { href: "/bookings", icon: "event", label: "Job requests" },
    { href: "/earnings", icon: "payments", label: "Earnings" },
    { href: "/verify-nic", icon: "verified_user", label: "Verification" },
  ];
  return (
    <div>
      <div className="bg-[linear-gradient(135deg,#834dfb,#6b2fe0)] dark:bg-[linear-gradient(135deg,#834dfb,#5b27c9)] relative overflow-hidden rounded-b-[30px] pb-8 text-white">
        <div className="absolute -right-12 top-2 h-44 w-44 rounded-full bg-white/[.09]" />
        <div className="relative px-[22px] pt-4">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-white/90">
              {seller?.is_pro ? "Sewa Pro" : "Seller"}
            </span>
            <Link href="/profile">
              <Avatar
                avatarUrl={avatarUrl}
                name={name}
                size="sm"
                className="h-[38px] w-[38px] bg-white text-[13px] text-brand"
              />
            </Link>
          </div>
          <h1 className="mt-5 text-[30px] font-extrabold leading-[1.08] tracking-tight">
            Ready to earn,
            <br />
            <span className="text-accent">{firstName}.</span>
          </h1>
        </div>
      </div>

      {profileIncomplete ? (
        <div className="px-[22px] pt-4">
          <Link
            href="/seller-profile"
            className="flex items-center gap-3 rounded-2xl bg-brand-tint p-3.5"
          >
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-surface">
              <Icon name="edit_note" className="text-brand-text" />
            </span>
            <div className="flex-1">
              <p className="text-[13.5px] font-extrabold">Complete your seller profile</p>
              <p className="text-xs text-muted-foreground">
                Add a bio and your service areas so buyers trust you faster.
              </p>
            </div>
            <Icon name="chevron_right" className="text-brand-text" />
          </Link>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 px-[22px] pb-24 pt-5">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="flex flex-col justify-between gap-6 rounded-2xl bg-surface p-4 shadow-[0_6px_20px_-12px_rgba(131,77,251,.3)]"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-brand-tint">
              <Icon name={l.icon} filled className="text-2xl text-brand-text" />
            </span>
            <span className="text-sm font-extrabold">{l.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
