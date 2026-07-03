import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";
import { formatLKR } from "@/lib/pricing";
import { approvePayout, markPayoutPaid, rejectPayout } from "../actions";
import type { PayoutStatus } from "@/lib/supabase/types";

const BADGE: Record<PayoutStatus, "warning" | "info" | "success" | "neutral"> = {
  pending: "warning",
  approved: "info",
  processing: "info",
  completed: "success",
  failed: "neutral",
};

export default async function AdminPayoutsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payouts")
    .select(
      "id, amount, status, requested_at, bank_account_name, bank_account_number, bank_name",
    )
    .order("requested_at", { ascending: false })
    .limit(50);

  const payouts = (data ?? []) as {
    id: string;
    amount: number;
    status: PayoutStatus;
    requested_at: string;
    bank_account_name: string | null;
    bank_account_number: string | null;
    bank_name: string | null;
  }[];

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold tracking-tight">Payouts</h1>
      {payouts.length === 0 ? (
        <EmptyState icon="payments" title="No payout requests yet" />
      ) : (
        <ul className="flex flex-col gap-3">
          {payouts.map((p) => (
            <li key={p.id}>
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-lg font-semibold tabular-nums">
                      {formatLKR(p.amount)}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {p.bank_account_name} · {p.bank_name} · {p.bank_account_number}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.requested_at).toLocaleString("en-LK", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <Badge variant={BADGE[p.status]} className="capitalize">
                    {p.status}
                  </Badge>
                </div>

                {p.status === "pending" || p.status === "approved" ? (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                    {p.status === "pending" ? (
                      <form action={approvePayout}>
                        <input type="hidden" name="payout_id" value={p.id} />
                        <Button size="sm" type="submit">
                          <Icon name="check" /> Approve
                        </Button>
                      </form>
                    ) : null}
                    {p.status === "approved" ? (
                      <form action={markPayoutPaid}>
                        <input type="hidden" name="payout_id" value={p.id} />
                        <Button size="sm" type="submit">
                          <Icon name="account_balance" /> Mark paid
                        </Button>
                      </form>
                    ) : null}
                    <form action={rejectPayout}>
                      <input type="hidden" name="payout_id" value={p.id} />
                      <Button size="sm" variant="destructive" type="submit">
                        Reject
                      </Button>
                    </form>
                  </div>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
