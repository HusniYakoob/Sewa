import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/icon";
import { PackagePicker, type PackageOption } from "./package-picker";

type ServiceDetail = {
  id: string;
  title: string;
  description: string;
  location_area: string | null;
  category: { name: string } | null;
  seller: {
    id: string;
    rating: number;
    total_reviews: number;
    total_bookings: number;
    nic_verified: boolean;
    created_at: string;
    plan: { key: string } | null;
    profile: { full_name: string } | null;
  } | null;
};

const INCLUDED = [
  "Vetted, NIC-verified providers",
  "Payment held safely until you confirm",
  "Free cancellation up to 24h before",
  "Covered by the Sewa Guarantee",
];

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
      "id, title, description, location_area, category:categories(name), seller:seller_profiles(id, rating, total_reviews, total_bookings, nic_verified, created_at, plan:plans(key), profile:profiles(full_name))",
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const s = data as unknown as ServiceDetail;

  const { data: pkgData } = await supabase
    .from("service_packages")
    .select("id, tier, name, description, price, price_unit")
    .eq("service_id", id)
    .order("sort_order");
  const packages = (pkgData ?? []) as PackageOption[];

  const { data: reviewData } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at, reviewer:profiles(full_name)")
    .eq("service_id", id)
    .order("created_at", { ascending: false })
    .limit(5);
  const reviews = (reviewData ?? []) as unknown as {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    reviewer: { full_name: string } | null;
  }[];

  const memberSince = s.seller?.created_at
    ? new Date(s.seller.created_at).getFullYear()
    : new Date().getFullYear();
  const isPro = s.seller?.plan?.key && s.seller.plan.key !== "starter";

  return (
    <div>
      <div className="relative h-[210px] overflow-hidden bg-[linear-gradient(135deg,#834dfb,#6b2fe0)]">
        <div className="pointer-events-none absolute -right-10 -top-8 h-[170px] w-[170px] rounded-full bg-white/[.09]" />
        {isPro ? (
          <span className="absolute bottom-4 left-[22px] flex items-center gap-1 rounded-lg bg-black/35 px-2.5 py-1.5">
            <Icon name="workspace_premium" className="text-[13px] text-accent" />
            <span className="text-[10px] font-extrabold tracking-wide text-white">PRO SELLER</span>
          </span>
        ) : null}
        <div className="absolute inset-x-[22px] top-3.5 flex justify-between">
          <Link
            href="/browse"
            aria-label="Back"
            className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white/85"
          >
            <Icon name="arrow_back" className="text-foreground" />
          </Link>
          <div className="flex gap-2">
            <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white/85">
              <Icon name="ios_share" className="text-foreground" />
            </span>
            <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white/85">
              <Icon name="favorite_border" className="text-foreground" />
            </span>
          </div>
        </div>
      </div>

      <div className="px-[22px] pt-4">
        <h1 className="text-[22px] font-extrabold leading-tight tracking-tight">{s.title}</h1>
        <div className="mt-2.5 flex items-center gap-2.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Icon name="star" filled className="text-base text-[#EAB308]" />
            <span className="font-extrabold text-foreground">
              {(s.seller?.rating ?? 0).toFixed(1)}
            </span>
            ({s.seller?.total_reviews ?? 0} reviews)
          </span>
          {s.location_area ? (
            <>
              <span className="h-[3px] w-[3px] rounded-full bg-muted-foreground" />
              <span>{s.location_area}</span>
            </>
          ) : null}
        </div>

        <Link
          href={s.seller ? `/chats/start?seller=${s.seller.id}` : "#"}
          className="mt-4 flex items-center gap-3 rounded-[18px] border-[1.5px] border-border bg-surface p-3.5 shadow-[0_6px_20px_-14px_rgba(131,77,251,.5)]"
        >
          <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#834dfb,#6b2fe0)] text-[15px] font-extrabold text-white">
            {(s.seller?.profile?.full_name ?? "S")
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")}
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[14.5px] font-extrabold">{s.seller?.profile?.full_name}</span>
              {s.seller?.nic_verified ? (
                <Icon name="verified" filled className="text-sm text-brand-text" />
              ) : null}
            </div>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              {s.seller?.total_bookings ?? 0} jobs completed · Member since {memberSince}
            </p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-tint">
            <Icon name="chat" className="text-brand-text" />
          </span>
        </Link>

        <p className="mb-2 mt-5 text-[11px] font-extrabold tracking-wide text-muted-foreground">
          ABOUT THIS GIG
        </p>
        <p className="text-[13px] leading-relaxed text-muted-foreground">{s.description}</p>

        <div className="mt-4 rounded-[18px] border-[1.5px] border-border bg-surface p-4 shadow-[0_6px_20px_-14px_rgba(131,77,251,.5)]">
          <p className="mb-2 text-[11px] font-extrabold tracking-wide text-muted-foreground">
            WHAT&rsquo;S INCLUDED
          </p>
          <div className="flex flex-col gap-2.5">
            {INCLUDED.map((item) => (
              <div key={item} className="flex items-start gap-2">
                <Icon name="check_circle" filled className="mt-0.5 text-base text-success" />
                <span className="text-[12.5px] leading-snug text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {packages.length > 0 ? (
          <PackagePicker serviceId={s.id} packages={packages} />
        ) : (
          <p className="mt-5 text-sm text-muted-foreground">
            This seller hasn&rsquo;t set up packages yet.
          </p>
        )}

        {reviews.length > 0 ? (
          <>
            <div className="mb-2.5 mt-6 flex items-center justify-between">
              <p className="text-[11px] font-extrabold tracking-wide text-muted-foreground">
                REVIEWS ({s.seller?.total_reviews ?? reviews.length})
              </p>
            </div>
            <div className="flex flex-col gap-2.5 pb-8">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl border-[1.5px] border-border bg-surface p-3.5 shadow-[0_6px_20px_-14px_rgba(131,77,251,.5)]"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-tint text-[11px] font-extrabold text-brand-text">
                      {(r.reviewer?.full_name ?? "B")
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <span className="flex-1 text-xs font-extrabold">{r.reviewer?.full_name}</span>
                    <span className="flex items-center gap-1 text-xs">
                      <Icon name="star" filled className="text-sm text-[#EAB308]" />
                      {r.rating}
                    </span>
                  </div>
                  {r.comment ? (
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {r.comment}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="pb-8" />
        )}
      </div>
    </div>
  );
}
