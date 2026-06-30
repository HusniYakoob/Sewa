import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Service-role client. BYPASSES Row Level Security — use ONLY in trusted
 * server code for money-critical operations: capturing payments, releasing
 * escrow, writing wallet entries, processing payouts/refunds, verifying PINs.
 * Never import this into a Client Component.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
