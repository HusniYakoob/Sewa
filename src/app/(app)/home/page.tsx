import Link from "next/link";
import { getCurrentProfile, getCurrentSellerProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { formatLKR } from "@/lib/pricing";
import type { BookingStatus } from "@/lib/supabase/types";

const GRADIENTS = [
  ["#834DFB", "#6B2FE0"],
  ["#F0A868", "#E0453C"],
  ["#68C2F0", "#3467C9"],
  ["#7CD98B", "#12A150"],
  ["#F0C868", "#B8860B"],
];

const PROMOS = [
  { icon: "workspace_premium", g1: "#834DFB", g2: "#6B2FE0", title: "Become a Seller", subtitle: "Free to join — start earning today", href: "/become-seller" },
  { icon: "verified_user", g1: "#F0A868", g2: "#E0453C", title: "Verified, trusted pros", subtitle: "Every seller is NIC-checked", href: "/categories" },
  { icon: "shield", g1: "#3467C9", g2: "#12A150", title: "Payment protection", subtitle: "Held safe until the job is done", href: "/help" },
] as const;

function greetingFor(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function HomePage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const isSeller = profile?.active_context === "seller";
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
    .select("id, scheduled_at, seller:seller_profiles(profile:profiles(full_name, avatar_url))")
    .eq("buyer_id", profile?.id ?? "")
    .eq("status", "accepted")
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const upcoming = upRow as unknown as {
    id: string;
    scheduled_at: string;
    seller: { profile: { full_name: string; avatar_url: string | null } | null } | null;
  } | null;

  const { data: gigData } = await supabase
    .from("services")
    .select(
      "id, title, price, rating, seller:seller_profiles(rating, nic_verified, plan:plans(key), profile:profiles(full_name))",
    )
    .eq("status", "active")
    .order("rating", { ascending: false })
    .limit(4);
  const gigs = (gigData ?? []) as unknown as {
    id: string;
    title: string;
    price: number;
    rating: number;
    seller: {
      rating: number;
      nic_verified: boolean;
      plan: { key: string } | null;
      profile: { full_name: string } | null;
    } | null;
  }[];

  // "Top pros" ranks by the seller's own rating, not the gig's — dedupe by
  // seller so the same pro doesn't show twice from two of their gigs.
  const seenSellers = new Set<string>();
  const topPros = [...gigs]
    .sort((a, b) => (b.seller?.rating ?? 0) - (a.seller?.rating ?? 0))
    .filter((g) => {
      const name = g.seller?.profile?.full_name;
      if (!name || seenSellers.has(name)) return false;
      seenSellers.add(name);
      return true;
    })
    .slice(0, 2);

  const hour = new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Colombo" });

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-[22px] pt-3">
        <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface py-1.5 pl-2.5 pr-3 text-[12.5px] font-bold">
          <Icon name="location_on" filled className="text-[15px] text-brand-text" /> Nugegoda
          <Icon name="expand_more" className="text-[15px] text-muted-foreground" />
        </span>
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface">
            <Icon name="notifications" className="text-[18px]" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full border border-surface bg-danger" />
          </span>
          <Link href="/account">
            <Avatar
              avatarUrl={profile?.avatar_url}
              name={profile?.full_name}
              size="sm"
              className="h-9 w-9 text-[12.5px]"
            />
          </Link>
        </div>
      </div>

      <div className="px-[22px] pt-5">
        <p className="text-[13px] font-bold text-muted-foreground">
          {greetingFor(Number(hour))}, {firstName}
        </p>
        <h1 className="mt-1 text-[26px] font-extrabold leading-[1.15] tracking-tight">
          What do you need done today?
        </h1>
        <Link
          href="/categories"
          className="mt-4 flex items-center gap-2.5 rounded-2xl border-[1.5px] border-border bg-surface px-4 py-3.5"
        >
          <Icon name="search" className="text-brand-text" />
          <span className="flex-1 text-sm text-muted-foreground">Search services or pros</span>
          <Icon name="tune" className="text-lg text-muted-foreground/60" />
        </Link>
      </div>

      {/* Promo carousel */}
      <div className="mt-5 flex gap-3 overflow-x-auto px-[22px] pb-0.5">
        {PROMOS.map((p) => (
          <Link
            key={p.title}
            href={p.href}
            className="relative flex-none w-[280px] overflow-hidden rounded-[20px] p-4.5"
            style={{ background: `linear-gradient(135deg, ${p.g1}, ${p.g2})` }}
          >
            <div className="pointer-events-none absolute -bottom-6 -right-6 h-[100px] w-[100px] rounded-full bg-white/10" />
            <span className="relative flex h-9 w-9 items-center justify-center rounded-[11px] bg-white/20">
              <Icon name={p.icon} className="text-lg text-white" />
            </span>
            <p className="relative mt-3 text-[15px] font-extrabold text-white">{p.title}</p>
            <p className="relative mt-0.5 text-xs text-white/85">{p.subtitle}</p>
          </Link>
        ))}
      </div>

      {/* Active job */}
      {active ? (
        <Link
          href={`/booking/${active.id}`}
          className="mx-[22px] mt-4.5 flex items-center gap-3 rounded-2xl bg-brand-tint p-3.5"
        >
          <span className="relative flex h-[34px] w-[34px] flex-none items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-brand/40" />
            <span className="relative flex h-[34px] w-[34px] items-center justify-center rounded-full bg-brand">
              <Icon name="cleaning_services" filled className="text-base text-white" />
            </span>
          </span>
          <div className="flex-1">
            <p className="text-[13px] font-extrabold">{active.service?.title ?? "Job"} in progress</p>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">Tap to view PINs</p>
          </div>
          <Icon name="chevron_right" className="text-brand-text" />
        </Link>
      ) : null}

      {/* Browse by category */}
      <div className="mt-5.5 px-[22px]">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[16px] font-extrabold">Browse by category</h2>
          <Link href="/categories" className="text-[12.5px] font-extrabold text-brand-text">
            See all
          </Link>
        </div>
      </div>
      <div className="mt-3.5 flex gap-2.5 overflow-x-auto px-[22px] pb-0.5">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/browse?category=${c.slug}`}
            className="flex flex-none items-center gap-2 rounded-full border border-border bg-surface py-2 pl-2 pr-4"
          >
            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-brand-tint">
              <Icon name={c.icon ?? "category"} filled className="text-[18px] text-brand-text" />
            </span>
            <span className="whitespace-nowrap text-[12.5px] font-bold">{c.name}</span>
          </Link>
        ))}
      </div>

      {/* Featured service ads */}
      <div className="mt-5 px-[22px]">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[16px] font-extrabold">Featured service ads</h2>
          <Link href="/browse" className="text-[12.5px] font-extrabold text-brand-text">
            See all
          </Link>
        </div>
      </div>
      {gigs.length === 0 ? (
        <p className="mt-3 px-[22px] text-sm text-muted-foreground">
          New providers are joining. Check back soon.
        </p>
      ) : (
        <div className="mt-3.5 flex gap-3 overflow-x-auto px-[22px] pb-0.5">
          {gigs.map((g, i) => {
            const [g1, g2] = GRADIENTS[i % GRADIENTS.length];
            const isPro = g.seller?.plan?.key && g.seller.plan.key !== "starter";
            return (
              <Link
                key={g.id}
                href={`/service/${g.id}`}
                className="flex-none w-[200px] overflow-hidden rounded-[18px] border-[1.5px] border-border bg-surface"
              >
                <div
                  className="relative h-24"
                  style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}
                >
                  {isPro ? (
                    <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-accent px-2 py-1">
                      <Icon name="workspace_premium" className="text-[11px] text-[#5B4B00]" />
                      <span className="text-[9px] font-extrabold tracking-wide text-[#5B4B00]">PRO</span>
                    </span>
                  ) : null}
                </div>
                <div className="p-3">
                  <p className="line-clamp-2 h-8 text-[12.5px] font-extrabold leading-tight">{g.title}</p>
                  <div className="mt-1.5 flex items-center gap-1">
                    <span className="truncate text-[11.5px] font-bold text-muted-foreground">
                      {g.seller?.profile?.full_name ?? "Sewa pro"}
                    </span>
                    {g.seller?.nic_verified ? (
                      <Icon name="verified" filled className="flex-none text-xs text-brand-text" />
                    ) : null}
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Icon name="star" filled className="text-[13px] text-[#EAB308]" />
                      <span className="text-[11.5px] font-extrabold">{(g.rating ?? 0).toFixed(1)}</span>
                    </span>
                    <span className="text-xs font-extrabold text-brand-text">{formatLKR(g.price)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Upcoming */}
      {upcoming ? (
        <div className="mt-5.5 px-[22px]">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[16px] font-extrabold">Upcoming</h2>
            <Link href="/bookings" className="text-[12.5px] font-extrabold text-brand-text">
              See all
            </Link>
          </div>
          <Link
            href={`/booking/${upcoming.id}`}
            className="mt-3 flex items-center gap-3 border-b border-border pb-4"
          >
            <Avatar
              avatarUrl={upcoming.seller?.profile?.avatar_url}
              name={upcoming.seller?.profile?.full_name}
              size="md"
              className="h-[46px] w-[46px] flex-none rounded-2xl"
            />
            <div className="flex-1">
              <p className="flex items-center gap-1.5 text-sm font-extrabold">
                {upcoming.seller?.profile?.full_name ?? "Sewa pro"}
                <Icon name="verified" filled className="text-sm text-brand-text" />
              </p>
              <div className="mt-1 flex items-center gap-2.5 text-[11.5px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Icon name="calendar_month" className="text-sm" />
                  {new Date(upcoming.scheduled_at).toLocaleDateString("en-LK", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="schedule" className="text-sm" />
                  {new Date(upcoming.scheduled_at).toLocaleTimeString("en-LK", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
            <Icon name="chevron_right" className="text-muted-foreground/40" />
          </Link>
        </div>
      ) : null}

      {/* Top pros near you */}
      {topPros.length > 0 ? (
        <div className="mt-5 px-[22px]">
          <h2 className="text-[16px] font-extrabold">Top pros near you</h2>
          <div className="mt-3 flex flex-col gap-2.5">
            {topPros.map((g, i) => {
              const [g1] = GRADIENTS[i % GRADIENTS.length];
              return (
                <Link
                  key={g.id}
                  href={`/service/${g.id}`}
                  className="flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-[0_4px_14px_-8px_rgba(131,77,251,.15)]"
                >
                  <span
                    className="h-12 w-12 flex-none rounded-2xl"
                    style={{ background: g1 }}
                  />
                  <div className="flex-1">
                    <p className="flex items-center gap-1 text-sm font-extrabold">
                      {g.seller?.profile?.full_name ?? "Sewa pro"}
                      <Icon name="verified" filled className="text-sm text-brand-text" />
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{g.title}</p>
                  </div>
                  <span className="flex items-center gap-1 rounded-full bg-background px-2.5 py-1.5">
                    <Icon name="star" filled className="text-sm text-[#EAB308]" />
                    <span className="text-xs font-extrabold">{(g.seller?.rating ?? 0).toFixed(1)}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
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
  const supabase = await createClient();
  const seller = await getCurrentSellerProfile();
  const profileIncomplete =
    !seller?.description?.trim() || (seller?.service_areas?.length ?? 0) === 0;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [{ data: earningsRows }, { count: adCount }, { data: currentPlan }] = await Promise.all([
    supabase
      .from("wallet_entries")
      .select("amount")
      .eq("seller_id", seller?.id ?? "")
      .eq("type", "earning")
      .gte("created_at", monthStart.toISOString()),
    supabase
      .from("services")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", seller?.id ?? ""),
    seller?.plan_id
      ? supabase.from("plans").select("key").eq("id", seller.plan_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const monthEarnings = (earningsRows ?? []).reduce((sum, r) => sum + Number(r.amount), 0);
  const adsCount = adCount ?? 0;
  const upgrade = currentPlan?.key !== "business";

  const stats = [
    { icon: "task_alt", label: "Jobs completed", value: String(seller?.total_bookings ?? 0) },
    { icon: "star", label: "Rating", value: (seller?.rating ?? 0).toFixed(1) },
    { icon: "campaign", label: "Active ads", value: String(adsCount) },
    {
      icon: "verified_user",
      label: "NIC status",
      value: seller?.nic_verified ? "Verified" : "Pending",
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 px-[22px] pt-3.5">
        <div className="flex-1">
          <p className="text-xs font-bold text-muted-foreground">Good to see you</p>
          <p className="mt-0.5 text-[19px] font-extrabold">{firstName}</p>
        </div>
        <Link href="/account">
          <Avatar avatarUrl={avatarUrl} name={name} size="sm" className="h-10 w-10" />
        </Link>
      </div>

      <div className="relative mx-[22px] mt-3.5 overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#834dfb,#6b2fe0)] p-5">
        <div className="pointer-events-none absolute -right-8 -top-8 h-[130px] w-[130px] rounded-full bg-white/10" />
        <div className="relative">
          <p className="text-[11px] font-extrabold tracking-wide text-[#D9C9FF]">
            THIS MONTH&rsquo;S EARNINGS
          </p>
          <p className="mt-1 text-[34px] font-extrabold leading-none tracking-tight text-white">
            {formatLKR(monthEarnings)}
          </p>
          {upgrade ? (
            <>
              <div className="my-4 h-px bg-white/20" />
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-bold text-[#E4D9FB]">
                  Upgrade for more ads &amp; lower fees
                </span>
                <Link href="/plans" className="text-xs font-extrabold text-accent">
                  View plans →
                </Link>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div className="mx-[22px] mt-3.5 grid grid-cols-2 gap-2.5">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-[18px] border-[1.5px] border-border bg-surface p-3.5"
          >
            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-brand-tint">
              <Icon name={s.icon} filled className="text-[19px] text-brand-text" />
            </span>
            <p className="mt-2 text-[11.5px] font-bold text-muted-foreground">{s.label}</p>
            <p className="mt-0.5 text-[19px] font-extrabold">{s.value}</p>
          </div>
        ))}
      </div>

      {profileIncomplete ? (
        <div className="px-[22px] pt-3.5">
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
        {[
          { href: "/services", icon: "campaign", label: "My Service Ads" },
          { href: "/bookings", icon: "event", label: "Jobs" },
          { href: "/earnings", icon: "account_balance_wallet", label: "Wallet" },
          { href: "/verify-nic", icon: "verified_user", label: "Verification" },
        ].map((l) => (
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
