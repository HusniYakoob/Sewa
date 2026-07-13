"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { serviceLimitFor } from "@/lib/pricing";

export interface ServiceFormState {
  error?: string;
}

/** Create a gig ad with Basic/Standard/Premium packages for the signed-in seller. */
export async function createService(
  _prev: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "");
  const subcategoryId = String(formData.get("subcategory_id") ?? "") || null;
  const locationArea = String(formData.get("location_area") ?? "").trim();
  const publish = formData.get("publish") === "on";

  const tiers = ["basic", "standard", "premium"] as const;
  const packages = tiers.map((tier) => ({
    tier,
    name: String(formData.get(`${tier}_name`) ?? "").trim() || tier,
    description: String(formData.get(`${tier}_description`) ?? "").trim(),
    price: Number(formData.get(`${tier}_price`)),
  }));

  if (!title || !categoryId) {
    return { error: "Title and category are required." };
  }
  if (packages.some((p) => !Number.isFinite(p.price) || p.price <= 0)) {
    return { error: "Enter a valid price for every package." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are signed out." };

  const { data: sellerData } = await supabase
    .from("seller_profiles")
    .select("id, plan:plans(ad_limit)")
    .eq("user_id", user.id)
    .maybeSingle();
  const seller = sellerData as unknown as { id: string; plan: { ad_limit: number } | null } | null;
  if (!seller) return { error: "Seller profile not found." };

  const { count } = await supabase
    .from("services")
    .select("id", { count: "exact", head: true })
    .eq("seller_id", seller.id);
  const limit = seller.plan?.ad_limit ?? serviceLimitFor(false);
  if ((count ?? 0) >= limit) {
    return {
      error: `You've reached your plan's limit of ${limit} service ads. Upgrade for more.`,
    };
  }

  const basicPrice = packages[0].price;
  const { data: service, error } = await supabase
    .from("services")
    .insert({
      seller_id: seller.id,
      category_id: categoryId,
      subcategory_id: subcategoryId,
      title,
      description,
      price: basicPrice,
      price_unit: "job",
      location_area: locationArea || null,
      status: publish ? "active" : "draft",
    })
    .select("id")
    .single();
  if (error || !service) return { error: error?.message ?? "Could not create the ad." };

  const { error: pkgError } = await supabase.from("service_packages").insert(
    packages.map((p, i) => ({
      service_id: service.id,
      tier: p.tier,
      name: p.name,
      description: p.description,
      price: p.price,
      price_unit: "job",
      sort_order: i + 1,
    })),
  );
  if (pkgError) return { error: pkgError.message };

  redirect("/services");
}
