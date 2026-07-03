import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { formatLKR } from "@/lib/pricing";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [total, completed, paid, pendingPayouts, pendingRefunds, completedRows] =
    await Promise.all([
      supabase.from("bookings").select("id", { count: "exact", head: true }),
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed"),
      supabase
        .from("payments")
        .select("id", { count: "exact", head: true })
        .eq("status", "succeeded"),
      supabase
        .from("payouts")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("refunds")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase.from("bookings").select("platform_net").eq("status", "completed"),
    ]);

  const commission = ((completedRows.data ?? []) as { platform_net: number }[]).reduce(
    (t, b) => t + Number(b.platform_net),
    0,
  );

  const stats = [
    { label: "Total bookings", value: String(total.count ?? 0) },
    { label: "Completed", value: String(completed.count ?? 0) },
    { label: "Payments received", value: String(paid.count ?? 0) },
    { label: "Pending payouts", value: String(pendingPayouts.count ?? 0) },
    { label: "Pending refunds", value: String(pendingRefunds.count ?? 0) },
  ];

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold tracking-tight">Dashboard</h1>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-mono text-2xl font-bold tabular-nums">
              {s.value}
            </p>
          </Card>
        ))}
      </div>
      <Card className="mt-3">
        <p className="text-sm text-muted-foreground">Commission earned</p>
        <p className="mt-1 font-mono text-2xl font-bold tabular-nums">
          {formatLKR(commission)}
        </p>
      </Card>
    </div>
  );
}
