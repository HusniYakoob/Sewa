"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Confirm the caller is an admin, then hand back a service-role client. */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if ((data as { role?: string } | null)?.role !== "admin") return null;
  return { admin: createAdminClient(), adminId: user.id };
}

async function logAction(
  admin: ReturnType<typeof createAdminClient>,
  adminId: string,
  action: string,
  entityId: string,
) {
  await admin.from("audit_logs").insert({
    admin_id: adminId,
    action,
    entity_type: "payout",
    entity_id: entityId,
  });
}

/** Approve a pending payout (ready for the bank transfer). */
export async function approvePayout(formData: FormData) {
  const ctx = await requireAdmin();
  if (!ctx) return;
  const id = String(formData.get("payout_id") ?? "");
  await ctx.admin
    .from("payouts")
    .update({
      status: "approved",
      approved_by: ctx.adminId,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending");
  await logAction(ctx.admin, ctx.adminId, "approved_payout", id);
  revalidatePath("/admin/payouts");
}

/** Mark an approved payout as paid after the bank transfer is done. */
export async function markPayoutPaid(formData: FormData) {
  const ctx = await requireAdmin();
  if (!ctx) return;
  const id = String(formData.get("payout_id") ?? "");
  await ctx.admin
    .from("payouts")
    .update({ status: "completed", processed_at: new Date().toISOString() })
    .eq("id", id)
    .in("status", ["approved", "processing"]);
  await logAction(ctx.admin, ctx.adminId, "completed_payout", id);
  revalidatePath("/admin/payouts");
}

/** Reject a payout, which frees the reserved balance back to the seller. */
export async function rejectPayout(formData: FormData) {
  const ctx = await requireAdmin();
  if (!ctx) return;
  const id = String(formData.get("payout_id") ?? "");
  const reason = String(formData.get("reason") ?? "Rejected by admin");
  await ctx.admin
    .from("payouts")
    .update({ status: "failed", failure_reason: reason })
    .eq("id", id)
    .in("status", ["pending", "approved"]);
  await logAction(ctx.admin, ctx.adminId, "rejected_payout", id);
  revalidatePath("/admin/payouts");
}
