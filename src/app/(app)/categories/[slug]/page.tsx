import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/icon";

export default async function SubcategoriesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();
  if (!category) notFound();

  const { data: subs } = await supabase
    .from("subcategories")
    .select("id, name, slug, icon")
    .eq("category_id", category.id)
    .eq("is_active", true)
    .order("sort_order");

  const subcategories = (subs ?? []) as { id: string; name: string; slug: string; icon: string | null }[];

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
        <div>
          <p className="text-[17px] font-extrabold">{category.name}</p>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">Choose a subcategory</p>
        </div>
      </div>

      <div className="px-[22px] pb-24 pt-4.5">
        <div className="grid grid-cols-2 gap-3">
          {subcategories.map((s) => (
            <Link
              key={s.id}
              href={`/browse?category=${category.slug}&subcategory=${s.slug}`}
              className="flex flex-col gap-2.5 rounded-[18px] border-[1.5px] border-border bg-surface p-4 shadow-[0_6px_20px_-14px_rgba(131,77,251,.4)] transition active:scale-[.97]"
            >
              <span className="flex h-[46px] w-[46px] items-center justify-center rounded-2xl bg-brand-tint">
                <Icon name={s.icon ?? "category"} filled className="text-[23px] text-brand-text" />
              </span>
              <p className="text-[13px] font-extrabold leading-tight">{s.name}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
