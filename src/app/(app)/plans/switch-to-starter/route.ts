import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Downgrading to Starter is free — no checkout needed. */
export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/welcome", req.url));

  const { data: seller } = await supabase
    .from("seller_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!seller) return NextResponse.redirect(new URL("/plans", req.url));

  const { data: starter } = await supabase
    .from("plans")
    .select("id, commission_rate")
    .eq("key", "starter")
    .maybeSingle();
  if (!starter) return NextResponse.redirect(new URL("/plans", req.url));

  const admin = createAdminClient();
  await admin
    .from("seller_profiles")
    .update({ plan_id: starter.id, commission_rate: starter.commission_rate, plan_renews_at: null })
    .eq("id", seller.id);

  return NextResponse.redirect(new URL("/account", req.url));
}
