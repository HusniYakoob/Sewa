import { createClient } from "@/lib/supabase/server";
import type { Profile, SellerProfile } from "./supabase/types";

/** The signed-in user's profile, or null if not authenticated. */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return data;
}

/** The signed-in seller's seller_profile, or null. */
export async function getCurrentSellerProfile(): Promise<SellerProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("seller_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  return data;
}
