"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface SellerDetailsState {
  error?: string;
}

/** Save the seller's public bio and service areas. */
export async function updateSellerDetails(
  _prev: SellerDetailsState,
  formData: FormData,
): Promise<SellerDetailsState> {
  const description = String(formData.get("description") ?? "").trim();
  const areasRaw = String(formData.get("service_areas") ?? "");
  const serviceAreas = areasRaw
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are signed out." };

  const { error } = await supabase
    .from("seller_profiles")
    .update({ description, service_areas: serviceAreas })
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/seller-profile");
  revalidatePath("/account");
  revalidatePath("/home");
  redirect("/account");
}
