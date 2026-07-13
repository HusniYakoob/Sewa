import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSellerProfile } from "@/lib/auth";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";
import { formatLKR, serviceLimitFor } from "@/lib/pricing";
import type { ServiceStatus } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  title: string;
  price: number;
  status: ServiceStatus;
  total_bookings: number;
};

const STATUS_LABEL: Record<ServiceStatus, string> = {
  active: "Active",
  draft: "Draft",
  paused: "Paused",
};

export default async function ServicesPage() {
  const seller = await getCurrentSellerProfile();
  const supabase = await createClient();
  const [{ data }, { data: planData }] = await Promise.all([
    supabase
      .from("services")
      .select("id, title, price, status, total_bookings")
      .eq("seller_id", seller?.id ?? "")
      .order("created_at", { ascending: false }),
    seller?.plan_id
      ? supabase.from("plans").select("ad_limit, key").eq("id", seller.plan_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const services = (data ?? []) as unknown as Row[];
  const limit = planData?.ad_limit ?? serviceLimitFor(false);
  const isFree = !planData?.key || planData.key === "starter";
  const atLimit = services.length >= limit;

  return (
    <div>
      <div className="flex items-center justify-between px-[22px] pt-3">
        <h1 className="text-[28px] font-extrabold tracking-tight">My Service Ads</h1>
        {!atLimit ? (
          <Link
            href="/services/new"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white"
          >
            <Icon name="add" />
          </Link>
        ) : null}
      </div>

      <div className="mx-[22px] mt-3.5 flex items-center justify-between rounded-2xl bg-brand-tint px-4 py-3">
        <span className="text-xs font-bold text-brand-text">
          {services.length} of {limit} ads used · {isFree ? "Free plan" : (planData?.key ?? "Pro")}
        </span>
        {isFree ? (
          <Link href="/plans" className="text-xs font-extrabold text-brand-text underline">
            Upgrade to Pro
          </Link>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 px-[22px] pb-24 pt-4">
        {services.length === 0 ? (
          <EmptyState
            icon="campaign"
            title="No service ads yet"
            description="Create your first ad so buyers can find and book you."
            action={
              <Link
                href="/services/new"
                className="rounded-xl bg-brand px-4 py-2.5 text-sm font-extrabold text-white"
              >
                Create ad
              </Link>
            }
          />
        ) : (
          services.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 rounded-[20px] border-[1.5px] border-border bg-surface p-3.5 shadow-[0_6px_20px_-14px_rgba(131,77,251,.5)]"
            >
              <span className="h-[52px] w-[52px] flex-none rounded-2xl bg-[linear-gradient(135deg,#834dfb,#6b2fe0)]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-extrabold">{s.title}</p>
                <p className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 font-bold",
                      s.status === "active"
                        ? "bg-success/15 text-success"
                        : "bg-surface-muted text-muted-foreground",
                    )}
                  >
                    {STATUS_LABEL[s.status]}
                  </span>
                  <span>{s.total_bookings} bookings</span>
                </p>
              </div>
              <span className="text-xs font-extrabold text-brand-text">
                From {formatLKR(s.price)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
