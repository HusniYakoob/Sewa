import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";
import { setSellerPlan } from "../actions";

type Row = {
  id: string;
  nic_verified: boolean;
  total_bookings: number;
  plan: { key: string; ad_limit: number } | null;
  profile: { full_name: string; email: string | null } | null;
};

const PLAN_KEYS = ["starter", "pro", "business"] as const;

export default async function AdminSellersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("seller_profiles")
    .select(
      "id, nic_verified, total_bookings, plan:plans(key, ad_limit), profile:profiles(full_name, email)",
    )
    .order("created_at", { ascending: false });

  const sellers = (data ?? []) as unknown as Row[];

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold tracking-tight">Sellers</h1>
      {sellers.length === 0 ? (
        <EmptyState icon="handyman" title="No sellers yet" />
      ) : (
        <ul className="flex flex-col gap-3">
          {sellers.map((s) => (
            <li key={s.id}>
              <Card className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {s.profile?.full_name || "Seller"}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {s.profile?.email} · {s.total_bookings} bookings · limit{" "}
                    {s.plan?.ad_limit ?? 3}
                  </p>
                </div>
                <div className="flex flex-none items-center gap-2">
                  {s.nic_verified ? (
                    <Badge variant="success">
                      <Icon name="verified" filled />
                    </Badge>
                  ) : null}
                  <form action={setSellerPlan} className="flex items-center gap-1.5">
                    <input type="hidden" name="seller_id" value={s.id} />
                    <select
                      name="plan_key"
                      defaultValue={s.plan?.key ?? "starter"}
                      className="h-9 rounded-md border border-border bg-surface px-2 text-xs capitalize"
                    >
                      {PLAN_KEYS.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                    <Button size="sm" type="submit">
                      Set
                    </Button>
                  </form>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
