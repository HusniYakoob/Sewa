"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Create a pending plan purchase, then send the seller to PayHere checkout. */
export async function purchasePlan(formData: FormData): Promise<void> {
  const planId = String(formData.get("plan_id") ?? "");
  if (!planId) redirect("/plans");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/welcome");

  const { data: seller } = await supabase
    .from("seller_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!seller) redirect("/become-seller");

  const { data: plan } = await supabase
    .from("plans")
    .select("id, key, price_lkr")
    .eq("id", planId)
    .maybeSingle();
  if (!plan) redirect("/plans");

  // Starter is free — no checkout needed, just switch immediately.
  if (plan.key === "starter") {
    redirect(`/plans/switch-to-starter`);
  }

  const { data: purchase, error } = await supabase
    .from("plan_purchases")
    .insert({ seller_id: seller.id, plan_id: plan.id, amount: plan.price_lkr, status: "pending" })
    .select("id")
    .single();
  if (error || !purchase) redirect("/plans");

  redirect(`/plans/checkout/${purchase.id}`);
}
