import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSellerProfile } from "@/lib/auth";
import { AppHeader } from "@/components/nav/app-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { serviceLimitFor } from "@/lib/pricing";
import { NewServiceForm } from "./new-service-form";

export default async function NewServicePage() {
  const seller = await getCurrentSellerProfile();
  const supabase = await createClient();

  const [{ data: categories }, { count }] = await Promise.all([
    supabase.from("categories").select("id, name").eq("is_active", true).order("sort_order"),
    supabase
      .from("services")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", seller?.id ?? ""),
  ]);

  const limit = serviceLimitFor(seller?.is_pro ?? false);
  const atLimit = (count ?? 0) >= limit;

  return (
    <div>
      <AppHeader title="Add service" backHref="/services" />
      {atLimit ? (
        <EmptyState
          icon="block"
          title={`You've reached your limit of ${limit} services`}
          description={
            seller?.is_pro
              ? "Pause or delete an existing listing to add a new one."
              : "Go Pro to list up to 10 services at once."
          }
          action={
            <Link href="/services">
              <Button size="sm" variant="secondary">
                <Icon name="arrow_back" /> Back to my services
              </Button>
            </Link>
          }
        />
      ) : (
        <NewServiceForm categories={categories ?? []} />
      )}
    </div>
  );
}
