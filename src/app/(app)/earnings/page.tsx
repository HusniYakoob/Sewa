import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSellerProfile } from "@/lib/auth";
import { getSellerBalance } from "@/lib/wallet";
import { AppHeader } from "@/components/nav/app-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { PayoutButton } from "./payout-button";
import { formatLKR, HOLD_WINDOW_HOURS } from "@/lib/pricing";
import type { PayoutStatus } from "@/lib/supabase/types";

const MIN_PAYOUT = 1000;

const PAYOUT_BADGE: Record<
  PayoutStatus,
  { variant: "neutral" | "success" | "warning" | "info"; label: string }
> = {
  pending: { variant: "warning", label: "Pending" },
  approved: { variant: "info", label: "Approved" },
  processing: { variant: "info", label: "Processing" },
  completed: { variant: "success", label: "Paid" },
  failed: { variant: "neutral", label: "Failed" },
};

export default async function EarningsPage() {
  const seller = await getCurrentSellerProfile();
  const supabase = await createClient();
  const sellerId = seller?.id ?? "";

  const { held, available } = await getSellerBalance(supabase, sellerId);
  const hasBank = Boolean(seller?.bank_account_number);

  const { data: payoutRows } = await supabase
    .from("payouts")
    .select("id, amount, status, requested_at")
    .eq("seller_id", sellerId)
    .order("requested_at", { ascending: false })
    .limit(10);
  const payouts = (payoutRows ?? []) as {
    id: string;
    amount: number;
    status: PayoutStatus;
    requested_at: string;
  }[];

  const canPayout = hasBank && available >= MIN_PAYOUT;

  return (
    <div>
      <AppHeader title="Earnings" />
      <div className="flex flex-col gap-4 p-4">
        <Card>
          <p className="text-sm text-muted-foreground">Available to withdraw</p>
          <p className="mt-1 font-mono text-3xl font-bold tabular-nums">
            {formatLKR(available)}
          </p>

          {!hasBank ? (
            <Link
              href="/earnings/bank"
              className="mt-4 flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm"
            >
              <span className="flex items-center gap-2">
                <Icon name="account_balance" /> Add bank details to withdraw
              </span>
              <Icon name="chevron_right" className="text-muted-foreground" />
            </Link>
          ) : (
            <div className="mt-4">
              <PayoutButton disabled={!canPayout} />
              {available < MIN_PAYOUT ? (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Minimum payout is {formatLKR(MIN_PAYOUT)}.
                </p>
              ) : null}
            </div>
          )}
        </Card>

        <Card className="flex items-center justify-between">
          <div>
            <p className="font-medium">Held</p>
            <p className="text-sm text-muted-foreground">
              Clears {HOLD_WINDOW_HOURS} hours after each job.
            </p>
          </div>
          <span className="font-mono font-semibold tabular-nums">
            {formatLKR(held)}
          </span>
        </Card>

        {hasBank ? (
          <Link
            href="/earnings/bank"
            className="flex items-center justify-between rounded-lg px-1 py-2 text-sm text-muted-foreground"
          >
            <span className="flex items-center gap-2">
              <Icon name="account_balance" className="text-base" />
              {seller?.bank_name} · ****{(seller?.bank_account_number ?? "").slice(-4)}
            </span>
            <span className="underline underline-offset-4">Edit</span>
          </Link>
        ) : null}

        {payouts.length > 0 ? (
          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Payout history
            </h2>
            <ul className="flex flex-col gap-2">
              {payouts.map((p) => (
                <li key={p.id}>
                  <Card className="flex items-center justify-between">
                    <div>
                      <p className="font-mono font-semibold tabular-nums">
                        {formatLKR(p.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.requested_at).toLocaleDateString("en-LK", {
                          dateStyle: "medium",
                        })}
                      </p>
                    </div>
                    <Badge variant={PAYOUT_BADGE[p.status].variant}>
                      {PAYOUT_BADGE[p.status].label}
                    </Badge>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
