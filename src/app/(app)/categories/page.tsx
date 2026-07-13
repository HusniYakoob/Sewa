import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/icon";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: cats } = await supabase
    .from("categories")
    .select("id, name, slug, icon, subcategories(id)")
    .eq("is_active", true)
    .order("sort_order");

  const categories = (cats ?? []) as unknown as {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    subcategories: { id: string }[];
  }[];

  return (
    <div>
      <h1 className="px-[22px] pt-3 text-[28px] font-extrabold tracking-tight">Services</h1>
      <div className="px-[22px] pt-3.5">
        <div className="flex items-center gap-2.5 rounded-2xl border-[1.5px] border-border bg-surface px-4 py-3">
          <Icon name="search" className="text-muted-foreground" />
          <span className="text-[13.5px] text-muted-foreground">Search all services…</span>
        </div>
      </div>
      <div className="px-[22px] pb-24 pt-4.5">
        <p className="mb-3 text-[11px] font-extrabold tracking-wide text-muted-foreground">
          MAIN CATEGORIES
        </p>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={c.subcategories.length > 0 ? `/categories/${c.slug}` : `/browse?category=${c.slug}`}
              className="flex flex-col gap-2.5 rounded-[18px] border-[1.5px] border-border bg-surface p-4 shadow-[0_6px_20px_-14px_rgba(131,77,251,.4)] transition active:scale-[.97]"
            >
              <span className="flex h-[46px] w-[46px] items-center justify-center rounded-2xl bg-brand-tint">
                <Icon name={c.icon ?? "category"} filled className="text-[23px] text-brand-text" />
              </span>
              <div>
                <p className="text-[13.5px] font-extrabold">{c.name}</p>
                <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                  {c.subcategories.length > 0
                    ? `${c.subcategories.length} subcategories`
                    : "Browse gigs"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
