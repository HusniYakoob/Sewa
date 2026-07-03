import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/nav/app-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { formatLKR, computeFees } from "@/lib/pricing";

type ServiceDetail = {
  id: string;
  title: string;
  description: string;
  price: number;
  price_unit: string;
  location_area: string | null;
  category: { name: string } | null;
  seller: {
    rating: number;
    total_reviews: number;
    nic_verified: boolean;
    profile: { full_name: string } | null;
  } | null;
};

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select(
      "id, title, description, price, price_unit, location_area, category:categories(name), seller:seller_profiles(rating, total_reviews, nic_verified, profile:profiles(full_name))",
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const s = data as unknown as ServiceDetail;
  const fees = computeFees(s.price);

  return (
    <div>
      <AppHeader title={s.category?.name ?? "Service"} backHref="/browse" />
      <div className="flex flex-col gap-4 p-4">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-bold tracking-tight">{s.title}</h1>
            {s.seller?.nic_verified ? (
              <Badge variant="success">
                <Icon name="verified" filled /> Verified
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            {s.seller?.profile?.full_name}
            <span className="flex items-center gap-1">
              <Icon name="star" filled className="text-base" />
              {(s.seller?.rating ?? 0).toFixed(1)} ({s.seller?.total_reviews ?? 0})
            </span>
          </p>
        </div>

        {s.description ? (
          <p className="text-sm text-foreground">{s.description}</p>
        ) : null}

        <Card>
          <p className="text-sm font-semibold">Price breakdown</p>
          <dl className="mt-3 flex flex-col gap-2 text-sm">
            <Row label="Service" value={formatLKR(fees.serviceAmount)} />
            <Row label="Service fee (5%)" value={formatLKR(fees.buyerFee)} />
            <div className="mt-1 border-t border-border pt-2">
              <Row label="Total" value={formatLKR(fees.totalCharged)} strong />
            </div>
          </dl>
        </Card>
      </div>

      <div className="px-4 pb-6">
        <Link href={`/book/${s.id}`} className={buttonVariants({ block: true })}>
          <Icon name="lock" /> Book now
        </Link>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Payment is held securely until the job is done.
        </p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className={strong ? "font-semibold" : "text-muted-foreground"}>
        {label}
      </dt>
      <dd className={strong ? "font-mono font-semibold tabular-nums" : "font-mono tabular-nums"}>
        {value}
      </dd>
    </div>
  );
}
