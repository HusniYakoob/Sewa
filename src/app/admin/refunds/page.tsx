import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";
import { formatLKR } from "@/lib/pricing";
import { approveRefund, rejectRefund } from "../actions";
import type { RefundStatus } from "@/lib/supabase/types";

const BADGE: Record<RefundStatus, "warning" | "info" | "success" | "neutral"> = {
  pending: "warning",
  approved: "info",
  processing: "info",
  completed: "success",
  rejected: "neutral",
};

export default async function AdminRefundsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("refunds")
    .select("id, amount, reason, explanation, status, created_at, service:bookings(service:services(title))")
    .order("created_at", { ascending: false })
    .limit(50);

  const refunds = (data ?? []) as unknown as {
    id: string;
    amount: number;
    reason: string;
    explanation: string | null;
    status: RefundStatus;
    created_at: string;
    service: { service: { title: string } | null } | null;
  }[];

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold tracking-tight">Refunds</h1>
      {refunds.length === 0 ? (
        <EmptyState icon="receipt_long" title="No refund requests yet" />
      ) : (
        <ul className="flex flex-col gap-3">
          {refunds.map((r) => (
            <li key={r.id}>
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-lg font-semibold tabular-nums">
                      {formatLKR(r.amount)}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {r.service?.service?.title ?? "Service"} · {r.reason.replace("_", " ")}
                    </p>
                    {r.explanation ? (
                      <p className="mt-1 text-sm">{r.explanation}</p>
                    ) : null}
                  </div>
                  <Badge variant={BADGE[r.status]} className="capitalize">
                    {r.status}
                  </Badge>
                </div>

                {r.status === "pending" ? (
                  <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
                    <form action={approveRefund}>
                      <input type="hidden" name="refund_id" value={r.id} />
                      <Button size="sm" type="submit">
                        <Icon name="check" /> Approve &amp; refund
                      </Button>
                    </form>
                    <form action={rejectRefund} className="flex gap-2">
                      <input type="hidden" name="refund_id" value={r.id} />
                      <Input name="reason" placeholder="Reason (optional)" className="h-9" />
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
