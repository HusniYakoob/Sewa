import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";
import { serviceLimitFor } from "@/lib/pricing";
import { toggleSellerPro } from "../actions";

type Row = {
  id: string;
  is_pro: boolean;
  nic_verified: boolean;
  total_bookings: number;
  profile: { full_name: string; email: string | null } | null;
};

export default async function AdminSellersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("seller_profiles")
    .select("id, is_pro, nic_verified, total_bookings, profile:profiles(full_name, email)")
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
                    {serviceLimitFor(s.is_pro)}
                  </p>
                </div>
                <div className="flex flex-none items-center gap-2">
                  {s.nic_verified ? (
                    <Badge variant="success">
                      <Icon name="verified" filled />
                    </Badge>
                  ) : null}
                  <form action={toggleSellerPro}>
                    <input type="hidden" name="seller_id" value={s.id} />
                    <input type="hidden" name="is_pro" value={String(!s.is_pro)} />
                    <Button size="sm" variant={s.is_pro ? "secondary" : "primary"}>
                      {s.is_pro ? "Revoke Pro" : "Make Pro"}
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
