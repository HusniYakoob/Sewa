import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSellerProfile } from "@/lib/auth";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { serviceLimitFor } from "@/lib/pricing";
import { AdWizard } from "./ad-wizard";

export default async function NewServicePage() {
  const seller = await getCurrentSellerProfile();
  const supabase = await createClient();

  const [{ data: categories }, { count }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, subcategories(id, name, category_id)")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("services")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", seller?.id ?? ""),
  ]);

  const { data: planData } = seller?.plan_id
    ? await supabase.from("plans").select("ad_limit").eq("id", seller.plan_id).maybeSingle()
    : { data: null };

  const limit = planData?.ad_limit ?? serviceLimitFor(false);
  const atLimit = (count ?? 0) >= limit;

  if (atLimit) {
    return (
      <div>
        <div className="flex items-center gap-3.5 px-[22px] pt-3">
          <Link
            href="/services"
            aria-label="Back"
            className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-border bg-surface"
          >
            <Icon name="arrow_back" />
          </Link>
        </div>
        <EmptyState
          icon="block"
          title={`You've reached your plan's limit of ${limit} ads`}
          description="Pause or delete an existing ad, or upgrade for more."
          action={
            <Link href="/plans">
              <Button size="sm">
                <Icon name="bolt" /> Upgrade plan
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return <AdWizard categories={categories ?? []} />;
}
