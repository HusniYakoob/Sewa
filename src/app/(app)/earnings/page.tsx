import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSellerProfile } from "@/lib/auth";
import { getSellerBalance } from "@/lib/wallet";
import { Icon } from "@/components/ui/icon";
import { PayoutButton } from "./payout-button";
import { formatLKR } from "@/lib/pricing";

const MIN_PAYOUT = 1000;

type Activity = {
  key: string;
  icon: string;
  title: string;
  sub: string;
  amount: string;
  positive: boolean;
  at: number;
  bookingId: string | null;
};

export default async function EarningsPage() {
  const seller = await getCurrentSellerProfile();
  const supabase = await createClient();
  const sellerId = seller?.id ?? "";

  const { held, available } = await getSellerBalance(supabase, sellerId);
  const hasBank = Boolean(seller?.bank_account_number);
  const canPayout = hasBank && seller?.nic_verified && available >= MIN_PAYOUT;

  const { data: nextRelease } = await supabase
    .from("wallet_entries")
    .select("available_at")
    .eq("seller_id", sellerId)
    .eq("status", "pending")
    .gt("available_at", new Date().toISOString())
    .order("available_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const releaseLabel = nextRelease?.available_at
    ? new Date(nextRelease.available_at).toLocaleDateString("en-LK", { weekday: "short" })
    : null;

  const [{ data: entryRows }, { data: payoutRows }] = await Promise.all([
    supabase
      .from("wallet_entries")
      .select("id, type, amount, created_at, booking_id")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("payouts")
      .select("id, amount, status, requested_at")
      .eq("seller_id", sellerId)
      .order("requested_at", { ascending: false })
      .limit(20),
  ]);

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString("en-LK", { day: "numeric", month: "short" });

  const activity: Activity[] = [];
  for (const e of (entryRows ?? []) as {
    id: string;
    type: string;
    amount: number;
    created_at: string;
    booking_id: string | null;
  }[]) {
    const map: Record<string, { icon: string; title: string; pos: boolean }> = {
      earning: { icon: "add_card", title: "Job earning", pos: true },
      refund_clawback: { icon: "undo", title: "Refund reversed", pos: false },
      guarantee_reserve: { icon: "shield", title: "Adjustment", pos: false },
      adjustment: { icon: "tune", title: "Adjustment", pos: true },
      payout: { icon: "account_balance", title: "Payout", pos: false },
    };
    const m = map[e.type] ?? map.adjustment;
    activity.push({
      key: `e${e.id}`,
      icon: m.icon,
      title: m.title,
      sub: fmtDate(e.created_at),
      amount: `${m.pos ? "+" : "−"} ${formatLKR(Math.abs(Number(e.amount)))}`,
      positive: m.pos,
      at: new Date(e.created_at).getTime(),
      bookingId: e.type === "earning" ? e.booking_id : null,
    });
  }
  for (const p of (payoutRows ?? []) as {
    id: string;
    amount: number;
    status: string;
    requested_at: string;
  }[]) {
    activity.push({
      key: `p${p.id}`,
      icon: "account_balance",
      title: `Payout · ${p.status}`,
      sub: fmtDate(p.requested_at),
      amount: `− ${formatLKR(Number(p.amount))}`,
      positive: false,
      at: new Date(p.requested_at).getTime(),
      bookingId: null,
    });
  }
  activity.sort((a, b) => b.at - a.at);

  return (
    <div className="px-[22px] pt-4">
      <h1 className="text-[28px] font-extrabold tracking-tight">Earnings</h1>

      {/* Balance card */}
      <div className="bg-[linear-gradient(135deg,#834dfb,#6b2fe0)] dark:bg-[linear-gradient(135deg,#834dfb,#5b27c9)] relative mt-4 overflow-hidden rounded-[24px] p-[22px] text-white">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative">
          <p className="text-[11.5px] font-extrabold tracking-wider text-[#D9C9FF]">
            AVAILABLE
          </p>
          <p className="mt-1 text-[38px] font-extrabold leading-none tracking-tight tabular-nums">
            {formatLKR(available)}
          </p>
          <div className="mt-4 flex items-center gap-2">
            {hasBank && seller?.nic_verified ? (
              <PayoutButton disabled={!canPayout} />
            ) : (
              <Link
                href={seller?.nic_verified ? "/earnings/bank" : "/verify-nic"}
                className="rounded-xl bg-accent px-6 py-3 text-sm font-extrabold text-accent-foreground"
              >
                {seller?.nic_verified ? "Add bank" : "Verify NIC"}
              </Link>
            )}
            <div className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3.5 py-3">
              <Icon name="lock" className="text-[15px] text-[#E4D9FB]" />
              <span className="text-xs font-bold text-[#E4D9FB]">
                {formatLKR(held)} on hold{releaseLabel ? ` · ${releaseLabel}` : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bank row */}
      {hasBank ? (
        <Link
          href="/earnings/bank"
          className="mt-3 flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-[0_6px_20px_-12px_rgba(131,77,251,.18)]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-tint">
            <Icon name="account_balance" className="text-xl text-brand-text" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-extrabold">
              {seller?.bank_name} ···· {(seller?.bank_account_number ?? "").slice(-4)}
            </p>
            {seller?.nic_verified ? (
              <span className="mt-0.5 flex items-center gap-1 text-[11.5px] font-bold text-brand-text">
                <Icon name="verified" filled className="text-[13px]" /> Name matches NIC
              </span>
            ) : null}
          </div>
          <Icon name="chevron_right" className="text-muted-foreground" />
        </Link>
      ) : null}

      {/* Activity */}
      <section className="pt-5 pb-24">
        <h2 className="text-base font-extrabold">Activity</h2>
        {activity.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No activity yet. Completed jobs will show here.
          </p>
        ) : (
          <div className="mt-1.5 flex flex-col">
            {activity.map((a) => {
              const content = (
                <>
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-tint">
                    <Icon name={a.icon} className="text-[19px] text-brand-text" />
                  </span>
                  <div className="flex-1">
                    <p className="text-[13.5px] font-extrabold capitalize">{a.title}</p>
                    <p className="mt-0.5 text-[11.5px] text-muted-foreground">{a.sub}</p>
                  </div>
                  <span
                    className={`text-sm font-extrabold tabular-nums ${a.positive ? "text-success" : "text-foreground"}`}
                  >
                    {a.amount}
                  </span>
                </>
              );
              return a.bookingId ? (
                <Link
                  key={a.key}
                  href={`/booking/${a.bookingId}`}
                  className="flex items-center gap-3 border-b border-border py-3.5"
                >
                  {content}
                </Link>
              ) : (
                <div key={a.key} className="flex items-center gap-3 border-b border-border py-3.5">
                  {content}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
