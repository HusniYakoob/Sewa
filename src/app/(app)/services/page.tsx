import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSellerProfile } from "@/lib/auth";
import { AppHeader } from "@/components/nav/app-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";
import { formatLKR } from "@/lib/pricing";
import type { ServiceStatus } from "@/lib/supabase/types";

type Row = {
  id: string;
  title: string;
  price: number;
  price_unit: string;
  status: ServiceStatus;
};

const STATUS: Record<ServiceStatus, "success" | "warning" | "neutral"> = {
  active: "success",
  draft: "neutral",
  paused: "warning",
};

export default async function ServicesPage() {
  const seller = await getCurrentSellerProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("id, title, price, price_unit, status")
    .eq("seller_id", seller?.id ?? "")
    .order("created_at", { ascending: false });

  const services = (data ?? []) as unknown as Row[];

  return (
    <div>
      <AppHeader
        title="My services"
        action={{ href: "/services/new", icon: "add", label: "Add service" }}
      />
      <div className="p-4">
        {services.length === 0 ? (
          <EmptyState
            icon="handyman"
            title="No services yet"
            description="List your first service so buyers can find and book you."
            action={
              <Link href="/services/new">
                <Button size="sm">
                  <Icon name="add" /> Add service
                </Button>
              </Link>
            }
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {services.map((s) => (
              <li key={s.id}>
                <Card className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{s.title}</p>
                    <p className="mt-0.5 font-mono text-sm tabular-nums text-muted-foreground">
                      {formatLKR(s.price)} / {s.price_unit}
                    </p>
                  </div>
                  <Badge variant={STATUS[s.status]} className="capitalize">
                    {s.status}
                  </Badge>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
