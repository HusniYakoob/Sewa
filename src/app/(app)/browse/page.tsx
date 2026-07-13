import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";
import { formatLKR } from "@/lib/pricing";

type BrowseService = {
  id: string;
  title: string;
  price: number;
  location_area: string | null;
  category: { name: string } | null;
  seller: {
    rating: number;
    nic_verified: boolean;
    total_reviews: number;
    plan: { key: string } | null;
    profile: { full_name: string } | null;
  } | null;
};

const GRADIENTS = [
  ["#834DFB", "#6B2FE0"],
  ["#F0A868", "#E0453C"],
  ["#68C2F0", "#3467C9"],
  ["#7CD98B", "#12A150"],
  ["#F0C868", "#B8860B"],
];

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; subcategory?: string }>;
}) {
  const { category, subcategory } = await searchParams;
  const supabase = await createClient();

  let categoryId: string | undefined;
  let categoryName = "Browse services";
  if (category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id, name")
      .eq("slug", category)
      .maybeSingle();
    categoryId = cat?.id;
    categoryName = cat?.name ?? categoryName;
  }

  let subcategoryId: string | undefined;
  if (subcategory) {
    const { data: sub } = await supabase
      .from("subcategories")
      .select("id, name")
      .eq("slug", subcategory)
      .maybeSingle();
    subcategoryId = sub?.id;
    if (sub?.name) categoryName = sub.name;
  }

  let query = supabase
    .from("services")
    .select(
      "id, title, price, location_area, category:categories(name), seller:seller_profiles(rating, nic_verified, total_reviews, plan:plans(key), profile:profiles(full_name))",
    )
    .eq("status", "active");

  if (subcategoryId) query = query.eq("subcategory_id", subcategoryId);
  else if (categoryId) query = query.eq("category_id", categoryId);

  const { data } = await query.order("rating", { ascending: false });
  const services = (data ?? []) as unknown as BrowseService[];

  return (
    <div>
      <div className="flex items-center gap-3.5 px-[22px] pt-3">
        <Link
          href="/categories"
          aria-label="Back"
          className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full border border-border bg-surface"
        >
          <Icon name="arrow_back" />
        </Link>
        <p className="text-[17px] font-extrabold">{categoryName}</p>
      </div>

      <div className="px-[22px] pt-3.5">
        <div className="flex items-center gap-2.5 rounded-2xl border-[1.5px] border-border bg-surface px-4 py-3">
          <Icon name="search" className="text-muted-foreground" />
          <span className="text-[13.5px] text-muted-foreground">Search cleaners, gigs…</span>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto px-[22px] pt-3">
        <span className="flex flex-none items-center gap-1 rounded-full bg-brand px-3.5 py-2 text-xs font-extrabold text-white">
          Recommended <Icon name="expand_more" className="text-sm" />
        </span>
        <span className="flex flex-none items-center rounded-full border-[1.5px] border-border bg-surface px-3.5 py-2 text-xs font-bold">
          Price
        </span>
        <span className="flex flex-none items-center rounded-full border-[1.5px] border-border bg-surface px-3.5 py-2 text-xs font-bold">
          Rating
        </span>
        <span className="flex flex-none items-center gap-1 rounded-full border-[1.5px] border-border bg-surface px-3.5 py-2 text-xs font-bold">
          <Icon name="verified" className="text-sm text-brand-text" /> Verified only
        </span>
      </div>

      <div className="px-[22px] pb-24 pt-4">
        <p className="mb-3 text-[11.5px] font-bold text-muted-foreground">
          {services.length} gig{services.length === 1 ? "" : "s"} near you
        </p>
        {services.length === 0 ? (
          <EmptyState
            icon="search_off"
            title="No gigs match your search"
            description="Try a different category, or check back soon."
          />
        ) : (
          <div className="flex flex-col gap-3.5">
            {services.map((s, i) => {
              const [g1, g2] = GRADIENTS[i % GRADIENTS.length];
              const isPro = s.seller?.plan?.key && s.seller.plan.key !== "starter";
              return (
                <Link
                  key={s.id}
                  href={`/service/${s.id}`}
                  className="overflow-hidden rounded-[20px] border-[1.5px] border-border bg-surface shadow-[0_4px_14px_-10px_rgba(131,77,251,.4)]"
                >
                  <div
                    className="relative h-[110px]"
                    style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}
                  >
                    {isPro ? (
                      <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-lg bg-black/35 px-2.5 py-1">
                        <Icon name="workspace_premium" className="text-xs text-accent" />
                        <span className="text-[9.5px] font-extrabold tracking-wide text-white">
                          PRO
                        </span>
                      </span>
                    ) : null}
                  </div>
                  <div className="p-3.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-brand text-[10px] font-extrabold text-white">
                        {(s.seller?.profile?.full_name ?? "S")
                          .split(" ")
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join("")}
                      </span>
                      <span className="text-xs font-bold">{s.seller?.profile?.full_name}</span>
                      {s.seller?.nic_verified ? (
                        <Icon name="verified" filled className="text-sm text-brand-text" />
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm font-extrabold leading-snug">{s.title}</p>
                    <div className="mt-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Icon name="star" filled className="text-sm text-[#EAB308]" />
                          <span className="font-extrabold text-foreground">
                            {(s.seller?.rating ?? 0).toFixed(1)}
                          </span>
                          ({s.seller?.total_reviews ?? 0})
                        </span>
                        {s.location_area ? (
                          <>
                            <span className="h-[3px] w-[3px] rounded-full bg-muted-foreground" />
                            <span>{s.location_area}</span>
                          </>
                        ) : null}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        From{" "}
                        <span className="text-[15px] font-extrabold text-brand-text">
                          {formatLKR(s.price)}
                        </span>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
