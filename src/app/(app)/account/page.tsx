import Link from "next/link";
import { getCurrentProfile, getCurrentSellerProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import { Avatar } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { formatLKR } from "@/lib/pricing";
import { setActiveContext } from "./actions";
import { cn } from "@/lib/utils";

const BUYER_MENU = [
  { href: "/bookings", icon: "event", label: "My bookings" },
  { href: "/saved", icon: "favorite", label: "Saved & Favorites" },
  { href: "/help", icon: "help", label: "Help & support" },
];

const SELLER_MENU = [
  { href: "/seller-profile", icon: "storefront", label: "Business profile" },
  { href: "/services", icon: "campaign", label: "My Service Ads" },
  { href: "/earnings/bank", icon: "account_balance", label: "Bank details" },
  { href: "/verify-nic", icon: "verified_user", label: "Verification" },
  { href: "/help", icon: "help", label: "Help & support" },
];

export default async function AccountPage() {
  const profile = await getCurrentProfile();
  const seller = profile?.role === "seller" || profile?.active_context === "seller"
    ? await getCurrentSellerProfile()
    : null;
  const supabase = await createClient();
  const hasSeller = Boolean(seller);
  const selling = profile?.active_context === "seller" && hasSeller;

  let monthEarnings = 0;
  if (selling && seller) {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const { data: rows } = await supabase
      .from("wallet_entries")
      .select("amount")
      .eq("seller_id", seller.id)
      .eq("type", "earning")
      .gte("created_at", monthStart.toISOString());
    monthEarnings = (rows ?? []).reduce((s, r) => s + Number(r.amount), 0);
  }

  let planName = "Starter";
  if (seller?.plan_id) {
    const { data: plan } = await supabase.from("plans").select("name").eq("id", seller.plan_id).maybeSingle();
    planName = plan?.name ?? planName;
  }

  const location = seller?.service_areas?.[0];
  const menu = selling ? SELLER_MENU : BUYER_MENU;

  return (
    <div>
      {hasSeller ? (
        <div className="mx-[22px] mt-3.5 flex rounded-2xl bg-surface-muted p-1">
          <form action={setActiveContext} className="flex-1">
            <input type="hidden" name="context" value="buyer" />
            <button
              type="submit"
              className={cn(
                "flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-extrabold transition",
                !selling ? "bg-brand text-white shadow-sm" : "text-muted-foreground",
              )}
            >
              <Icon name="shopping_bag" filled={!selling} className="text-[17px]" />
              Buying
            </button>
          </form>
          <form action={setActiveContext} className="flex-1">
            <input type="hidden" name="context" value="seller" />
            <button
              type="submit"
              className={cn(
                "flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-extrabold transition",
                selling ? "bg-brand text-white shadow-sm" : "text-muted-foreground",
              )}
            >
              <Icon name="handyman" filled={selling} className="text-[17px]" />
              Selling
            </button>
          </form>
        </div>
      ) : null}

      <div className="mx-[22px] mt-3.5 flex items-center gap-3.5 rounded-[22px] border-[1.5px] border-border bg-surface p-4.5">
        <Avatar avatarUrl={profile?.avatar_url} name={profile?.full_name} size="lg" />
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[17px] font-extrabold">{profile?.full_name || "You"}</span>
            {selling && seller?.nic_verified ? (
              <Icon name="verified" filled className="text-sm text-brand-text" />
            ) : null}
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            {selling ? planName : "Buyer"}
            {location ? ` · ${location}` : ""}
            {selling && seller ? (
              <>
                {" "}
                <Icon name="star" filled className="text-sm text-[#EAB308]" /> {seller.rating.toFixed(1)}
              </>
            ) : null}
          </p>
        </div>
        <Link
          href="/account/edit"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted"
        >
          <Icon name="edit" className="text-brand-text" />
        </Link>
      </div>

      {selling ? (
        <div className="mx-[22px] mt-3.5 grid grid-cols-3 gap-2">
          <StatChip value={formatLKR(monthEarnings).replace("LKR ", "")} label="LKR THIS MO." />
          <StatChip value={String(seller?.total_bookings ?? 0)} label="TOTAL JOBS" />
          <StatChip value={(seller?.rating ?? 0).toFixed(1)} label="PRO RATING" />
        </div>
      ) : null}

      {!hasSeller ? (
        <Link
          href="/become-seller"
          className="relative mx-[22px] mt-3.5 flex items-center gap-3 overflow-hidden rounded-2xl bg-[#1B1C2B] p-4.5"
        >
          <div className="pointer-events-none absolute -right-5 -top-5 h-[90px] w-[90px] rounded-full bg-accent/10" />
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent">
            <Icon name="handyman" filled className="text-[22px] text-[#1B1C2B]" />
          </span>
          <div className="relative flex-1">
            <p className="text-[14.5px] font-extrabold text-white">Become a Seller</p>
            <p className="mt-0.5 text-xs text-[#9A96AB]">Free to join — plans from LKR 0</p>
          </div>
          <Icon name="chevron_right" className="text-muted-foreground" />
        </Link>
      ) : (
        <Link
          href="/plans"
          className={cn(
            "mx-[22px] mt-3 flex items-center gap-3 rounded-2xl p-3.5",
            selling ? "bg-[#1B1C2B]" : "border-[1.5px] border-border bg-surface",
          )}
        >
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-[11px]",
              selling ? "bg-accent" : "bg-brand-tint",
            )}
          >
            <Icon
              name="workspace_premium"
              filled
              className={cn("text-[19px]", selling ? "text-[#1B1C2B]" : "text-brand-text")}
            />
          </span>
          <div className="flex-1">
            <p className={cn("text-[13.5px] font-extrabold", selling ? "text-white" : "")}>
              {planName} plan
            </p>
            <p className={cn("mt-0.5 text-[11.5px]", selling ? "text-[#9A96AB]" : "text-muted-foreground")}>
              Manage your seller plan
            </p>
          </div>
          <Icon name="chevron_right" className="text-muted-foreground" />
        </Link>
      )}

      <div className="mx-[22px] mt-3.5 overflow-hidden rounded-2xl border-[1.5px] border-border bg-surface">
        {menu.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="flex items-center gap-3.5 border-b border-border px-4.5 py-3.5 last:border-b-0"
          >
            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-surface-muted">
              <Icon name={m.icon} className="text-[19px] text-brand-text" />
            </span>
            <span className="flex-1 text-sm font-bold">{m.label}</span>
            <Icon name="chevron_right" className="text-muted-foreground/40" />
          </Link>
        ))}
        <Link
          href="/settings"
          className="flex items-center gap-3.5 border-b border-border px-4.5 py-3.5 last:border-b-0"
        >
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-surface-muted">
            <Icon name="settings" className="text-[19px] text-brand-text" />
          </span>
          <span className="flex-1 text-sm font-bold">Settings</span>
          <Icon name="chevron_right" className="text-muted-foreground/40" />
        </Link>
      </div>

      <form action={signOut} className="mx-[22px] mt-4.5 pb-24 text-center">
        <button type="submit" className="text-[13.5px] font-extrabold text-danger">
          Sign out
        </button>
      </form>
    </div>
  );
}

function StatChip({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border-[1.5px] border-border bg-surface py-3 text-center">
      <p className="text-[15px] font-extrabold">{value}</p>
      <p className="mt-0.5 text-[9px] font-extrabold tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
