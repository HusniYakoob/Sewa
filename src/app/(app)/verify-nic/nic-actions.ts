"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface NicState {
  error?: string;
  ok?: boolean;
}

function maskNic(nic: string): string {
  const clean = nic.replace(/\s/g, "");
  if (clean.length <= 4) return clean;
  return "*".repeat(clean.length - 4) + clean.slice(-4);
}

/** Record a NIC verification submission (files already uploaded to storage). */
export async function submitNic(
  _prev: NicState,
  formData: FormData,
): Promise<NicState> {
  const nic = String(formData.get("nic_number") ?? "").trim();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const dob = String(formData.get("date_of_birth") ?? "");
  const documentUrl = String(formData.get("document_url") ?? "");
  const selfieUrl = String(formData.get("selfie_url") ?? "");

  if (!nic || !fullName || !documentUrl || !selfieUrl) {
    return { error: "Fill every field and upload both photos." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are signed out." };

  const { error } = await supabase.from("nic_verifications").upsert(
    {
      user_id: user.id,
      nic_masked: maskNic(nic),
      full_name: fullName,
      date_of_birth: dob || null,
      document_url: documentUrl,
      selfie_url: selfieUrl,
      status: "pending",
      rejection_reason: null,
    },
    { onConflict: "user_id" },
  );
  if (error) return { error: error.message };

  revalidatePath("/verify-nic");
  return { ok: true };
}
