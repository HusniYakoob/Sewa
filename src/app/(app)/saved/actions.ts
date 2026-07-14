"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleSaved(serviceId: string, saved: boolean): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to save services." };

  if (saved) {
    await supabase.from("saved_services").delete().eq("buyer_id", user.id).eq("service_id", serviceId);
  } else {
    await supabase.from("saved_services").insert({ buyer_id: user.id, service_id: serviceId });
  }
  revalidatePath("/saved");
  revalidatePath("/browse");
  revalidatePath(`/service/${serviceId}`);
  return {};
}
