"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSellerBalance } from "@/lib/wallet";

export interface EarningsState {
  error?: string;
  ok?: boolean;
}

const MIN_PAYOUT = 1000;

async function currentSeller() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, error: "You are signed out." as const };
  const { data } = await supabase
    .from("seller_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  const seller = data as Record<string, unknown> | null;
  if (!seller) return { supabase, error: "Seller profile not found." as const };
  return { supabase, seller };
}

/** Save the seller's payout bank details. */
export async function updateBankDetails(
  _prev: EarningsState,
  formData: FormData,
): Promise<EarningsState> {
  const name = String(formData.get("bank_account_name") ?? "").trim();
  const number = String(formData.get("bank_account_number") ?? "").trim();
  const bank = String(formData.get("bank_name") ?? "").trim();
  const branch = String(formData.get("bank_branch") ?? "").trim();

  if (!name || !number || !bank) {
    return { error: "Account name, number and bank are required." };
  }

  const res = await currentSeller();
  if ("error" in res && res.error) return { error: res.error };
  const { supabase, seller } = res as { supabase: Awaited<ReturnType<typeof createClient>>; seller: Record<string, unknown> };

  const { error } = await supabase
    .from("seller_profiles")
    .update({
      bank_account_name: name,
      bank_account_number: number,
      bank_name: bank,
      bank_branch: branch || null,
    })
    .eq("id", seller.id as string);
  if (error) return { error: error.message };

  redirect("/earnings");
}

/** Request a payout of the full available balance. */
export async function requestPayout(
  _prev: EarningsState,
  _formData: FormData,
): Promise<EarningsState> {
  const res = await currentSeller();
  if ("error" in res && res.error) return { error: res.error };
  const { supabase, seller } = res as { supabase: Awaited<ReturnType<typeof createClient>>; seller: Record<string, unknown> };

  if (!seller.nic_verified) {
    return { error: "Verify your NIC before requesting a payout." };
  }
  if (!seller.bank_account_number) {
    return { error: "Add your bank details first." };
  }

  const { available } = await getSellerBalance(supabase, seller.id as string);
  if (available < MIN_PAYOUT) {
    return { error: `Minimum payout is LKR ${MIN_PAYOUT.toLocaleString()}.` };
  }

  const { error } = await supabase.from("payouts").insert({
    seller_id: seller.id as string,
    amount: available,
    status: "pending",
    bank_account_name: seller.bank_account_name as string,
    bank_account_number: seller.bank_account_number as string,
    bank_name: seller.bank_name as string,
  });
  if (error) return { error: error.message };

  revalidatePath("/earnings");
  return { ok: true };
}
