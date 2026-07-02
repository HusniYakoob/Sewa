import { createClient } from "@/lib/supabase/server";
import { getCurrentSellerProfile } from "@/lib/auth";
import { AppHeader } from "@/components/nav/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { formatLKR } from "@/lib/pricing";
import type { WalletEntry } from "@/lib/supabase/types";

const MIN_PAYOUT = 1000;

export default async function EarningsPage() {
  const seller = await getCurrentSellerProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("wallet_entries")
    .select("*")
    .eq("seller_id", seller?.id ?? "");

  const entries = (data ?? []) as WalletEntry[];
  const sum = (status: WalletEntry["status"]) =>
    entries
      .filter((e) => e.status === status)
      .reduce((t, e) => t + Number(e.amount), 0);

  const available = sum("available");
  const pending = sum("pending"); // earnings still inside the hold window

  return (
    <div>
      <AppHeader title="Earnings" />
      <div className="flex flex-col gap-4 p-4">
        <Card>
          <p className="text-sm text-muted-foreground">Available to withdraw</p>
          <p className="mt-1 font-mono text-3xl font-bold tabular-nums">
            {formatLKR(available)}
          </p>
          <Button block className="mt-4" disabled={available < MIN_PAYOUT}>
            <Icon name="account_balance" /> Request payout
          </Button>
          {available < MIN_PAYOUT ? (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Minimum payout is {formatLKR(MIN_PAYOUT)}.
            </p>
          ) : null}
        </Card>

        <Card className="flex items-center justify-between">
          <div>
            <p className="font-medium">Pending</p>
            <p className="text-sm text-muted-foreground">
              Clears after the {72}-hour hold window.
            </p>
          </div>
          <span className="font-mono font-semibold tabular-nums">
            {formatLKR(pending)}
          </span>
        </Card>
      </div>
    </div>
  );
}
