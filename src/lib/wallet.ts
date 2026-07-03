import type { SupabaseClient } from "@supabase/supabase-js";

/** Payout states that reserve balance (exclude failed/rejected). */
const RESERVING = ["pending", "approved", "processing", "completed"];

export interface SellerBalance {
  held: number; // earned but inside the hold window
  available: number; // cleared and not yet reserved by a payout
}

/**
 * Compute a seller's balance from the wallet ledger and payouts.
 * Availability is driven by each earning's available_at (no cron needed):
 * earnings past their hold are "cleared"; open payouts reserve against them.
 */
export async function getSellerBalance(
  supabase: SupabaseClient,
  sellerId: string,
): Promise<SellerBalance> {
  const { data: entryRows } = await supabase
    .from("wallet_entries")
    .select("amount, type, available_at")
    .eq("seller_id", sellerId);
  const { data: payoutRows } = await supabase
    .from("payouts")
    .select("amount, status")
    .eq("seller_id", sellerId);

  const entries = (entryRows ?? []) as {
    amount: number;
    type: string;
    available_at: string | null;
  }[];
  const payouts = (payoutRows ?? []) as { amount: number; status: string }[];

  const now = Date.now();
  let held = 0;
  let cleared = 0;
  for (const e of entries) {
    if (e.type !== "earning") continue;
    const amt = Number(e.amount);
    if (e.available_at && new Date(e.available_at).getTime() > now) held += amt;
    else cleared += amt;
  }

  const reserved = payouts
    .filter((p) => RESERVING.includes(p.status))
    .reduce((t, p) => t + Number(p.amount), 0);

  return { held, available: Math.max(0, cleared - reserved) };
}
