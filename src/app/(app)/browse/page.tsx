import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/nav/app-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";
import { formatLKR } from "@/lib/pricing";

type BrowseService = {
  id: string;
  title: string;
  price: number;
  price_unit: string;
  location_area: string | null;
  rating: number;
  category: { name: string } | null;
  seller: { rating: number; nic_verified: boolean; total_reviews: number } | null;
};

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const supabase = await createClient();

  // Resolve the category slug to an id first, then filter services by it.
  let categoryId: string | undefined;
  if (category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", category)
      .maybeSingle();
    categoryId = (cat as { id: string } | null)?.id;
  }

  let query = supabase
    .from("services")
    .select(
      "id, title, price, price_unit, location_area, rating, category:categories(name, slug), seller:seller_profiles(rating, nic_verified, total_reviews)",
    )
    .eq("status", "active");

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data } = await query.order("rating", { ascending: false });
  const services = (data ?? []) as unknown as BrowseService[];

  return (
    <div>
      <AppHeader title="Browse services" />
      <div className="p-4">
        {services.length === 0 ? (
          <EmptyState
            icon="search_off"
            title="No services yet"
            description="Providers are being onboarded. Check back soon."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {services.map((s) => (
              <li key={s.id}>
                <Link href={`/service/${s.id}`}>
                  <Card className="transition-colors hover:bg-surface-muted">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{s.title}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {s.category?.name}
                          {s.location_area ? ` · ${s.location_area}` : ""}
                        </p>
                      </div>
                      {s.seller?.nic_verified ? (
                        <Badge variant="success">
                          <Icon name="verified" filled /> Verified
                        </Badge>
                      ) : null}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-mono font-semibold tabular-nums">
                        {formatLKR(s.price)}
                        <span className="text-xs font-normal text-muted-foreground">
                          {" "}
                          / {s.price_unit}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Icon name="star" filled className="text-base" />
                        {(s.seller?.rating ?? 0).toFixed(1)} ({s.seller?.total_reviews ?? 0})
                      </span>
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
