"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActiveContext } from "@/lib/supabase/types";

/** Flip the Buying<->Selling toggle. Selling requires an existing seller_profiles row. */
export async function setActiveContext(formData: FormData): Promise<void> {
  const context = String(formData.get("context") ?? "") as ActiveContext;
  if (context !== "buyer" && context !== "seller") return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  if (context === "seller") {
    const { data: seller } = await supabase
      .from("seller_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!seller) return;
  }

  await supabase.from("profiles").update({ active_context: context }).eq("id", user.id);
  revalidatePath("/", "layout");
}
