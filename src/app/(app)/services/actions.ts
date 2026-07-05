"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { serviceLimitFor } from "@/lib/pricing";

export interface ServiceFormState {
  error?: string;
}

/** Create a service listing for the signed-in seller. */
export async function createService(
  _prev: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "");
  const price = Number(formData.get("price"));
  const priceUnit = String(formData.get("price_unit") ?? "hour");
  const locationArea = String(formData.get("location_area") ?? "").trim();
  const publish = formData.get("publish") === "on";

  if (!title || !categoryId) {
    return { error: "Title and category are required." };
  }
  if (!Number.isFinite(price) || price <= 0) {
    return { error: "Enter a valid price." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are signed out." };

  const { data: sellerData } = await supabase
    .from("seller_profiles")
    .select("id, is_pro")
    .eq("user_id", user.id)
    .maybeSingle();
  const seller = sellerData as { id: string; is_pro: boolean } | null;
  if (!seller) return { error: "Seller profile not found." };

  const { count } = await supabase
    .from("services")
    .select("id", { count: "exact", head: true })
    .eq("seller_id", seller.id);
  const limit = serviceLimitFor(seller.is_pro);
  if ((count ?? 0) >= limit) {
    return {
      error: seller.is_pro
        ? `You've reached the Pro limit of ${limit} services.`
        : `Free plan allows up to ${limit} services. Go Pro for up to 10.`,
    };
  }

  const { error } = await supabase.from("services").insert({
    seller_id: seller.id,
    category_id: categoryId,
    title,
    description,
    price,
    price_unit: priceUnit,
    location_area: locationArea || null,
    status: publish ? "active" : "draft",
  });
  if (error) return { error: error.message };

  redirect("/services");
}
