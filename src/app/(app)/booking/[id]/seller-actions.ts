"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { HOLD_WINDOW_HOURS } from "@/lib/pricing";

export interface JobState {
  error?: string;
  ok?: boolean;
}

const LOCK_MINUTES = 15;
const MAX_ATTEMPTS = 3;

/**
 * Confirm the caller is the seller who owns this booking, then return an admin
 * client and the booking. The admin client bypasses RLS, so this ownership
 * check is the security boundary — never skip it.
 */
async function requireSellerBooking(bookingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are signed out." as const };

  const { data: sp } = await supabase
    .from("seller_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  const sellerId = (sp as { id: string } | null)?.id;
  if (!sellerId) return { error: "Seller profile not found." as const };

  const admin = createAdminClient();
  const { data: b } = await admin
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle();
  const booking = b as Record<string, unknown> | null;
  if (!booking || booking.seller_id !== sellerId) {
    return { error: "This is not your job." as const };
  }
  return { admin, booking } as const;
}

/**
 * Seller confirms a pending request. This does NOT charge the buyer — it
 * just unlocks the buyer's "pay now" step (see book/[id]/actions.ts and
 * booking/[id]/page.tsx). Actual payment is still captured by the PayHere
 * webhook, same as before.
 */
export async function approveBookingRequest(
  _prev: JobState,
  formData: FormData,
): Promise<JobState> {
  const bookingId = String(formData.get("booking_id") ?? "");
  const res = await requireSellerBooking(bookingId);
  if ("error" in res) return { error: res.error };
  const { admin, booking } = res;

  if (booking.status !== "pending" || booking.seller_approved_at) {
    return { error: "This request has already been actioned." };
  }
  await admin
    .from("bookings")
    .update({ seller_approved_at: new Date().toISOString() })
    .eq("id", bookingId);
  revalidatePath(`/booking/${bookingId}`);
  revalidatePath("/bookings");
  return { ok: true };
}

/** Seller declines a pending request. No charge ever happened, so this just closes it. */
export async function declineBookingRequest(
  _prev: JobState,
  formData: FormData,
): Promise<JobState> {
  const bookingId = String(formData.get("booking_id") ?? "");
  const res = await requireSellerBooking(bookingId);
  if ("error" in res) return { error: res.error };
  const { admin, booking } = res;

  if (booking.status !== "pending" || booking.seller_approved_at) {
    return { error: "This request has already been actioned." };
  }
  await admin
    .from("bookings")
    .update({ status: "declined", cancelled_at: new Date().toISOString(), cancelled_by: "seller" })
    .eq("id", bookingId);
  revalidatePath(`/booking/${bookingId}`);
  revalidatePath("/bookings");
  return { ok: true };
}

/** Seller marks they have arrived on site (enables the full cancellation cut). */
export async function markArrived(
  _prev: JobState,
  formData: FormData,
): Promise<JobState> {
  const bookingId = String(formData.get("booking_id") ?? "");
  const res = await requireSellerBooking(bookingId);
  if ("error" in res) return { error: res.error };
  const { admin, booking } = res;

  if (booking.status !== "accepted") {
    return { error: "You can only mark arrived on a confirmed booking." };
  }
  await admin
    .from("bookings")
    .update({ status: "arrived", arrived_at: new Date().toISOString() })
    .eq("id", bookingId);
  revalidatePath(`/booking/${bookingId}`);
  return { ok: true };
}

async function checkPin(
  admin: ReturnType<typeof createAdminClient>,
  bookingId: string,
  which: "start" | "end",
  entered: string,
): Promise<{ error?: string; ok?: boolean }> {
  const { data: row } = await admin
    .from("booking_pins")
    .select("*")
    .eq("booking_id", bookingId)
    .maybeSingle();
  const pins = row as Record<string, unknown> | null;
  if (!pins) return { error: "PINs not found for this booking." };

  const lockedUntil = pins[`${which}_pin_locked_until`] as string | null;
  if (lockedUntil && new Date(lockedUntil) > new Date()) {
    return { error: "Too many wrong attempts. Try again in a few minutes." };
  }

  const actual = String(pins[`${which}_pin`] ?? "");
  if (entered !== actual) {
    const attempts = Number(pins[`${which}_pin_attempts`] ?? 0) + 1;
    const update: Record<string, unknown> = {
      [`${which}_pin_attempts`]: attempts,
    };
    if (attempts >= MAX_ATTEMPTS) {
      update[`${which}_pin_locked_until`] = new Date(
        Date.now() + LOCK_MINUTES * 60_000,
      ).toISOString();
    }
    await admin.from("booking_pins").update(update).eq("booking_id", bookingId);
    return {
      error:
        attempts >= MAX_ATTEMPTS
          ? `Locked for ${LOCK_MINUTES} minutes after ${MAX_ATTEMPTS} wrong attempts.`
          : "Wrong PIN. Ask the customer to read it again.",
    };
  }

  await admin
    .from("booking_pins")
    .update({
      [`${which}_pin_verified_at`]: new Date().toISOString(),
      [`${which}_pin_attempts`]: 0,
      [`${which}_pin_locked_until`]: null,
    })
    .eq("booking_id", bookingId);
  return { ok: true };
}

/** Verify the START PIN to begin the service. */
export async function verifyStartPin(
  _prev: JobState,
  formData: FormData,
): Promise<JobState> {
  const bookingId = String(formData.get("booking_id") ?? "");
  const pin = String(formData.get("pin") ?? "").trim();
  const res = await requireSellerBooking(bookingId);
  if ("error" in res) return { error: res.error };
  const { admin, booking } = res;

  if (booking.status !== "arrived") {
    return { error: "Mark yourself arrived before starting." };
  }
  const check = await checkPin(admin, bookingId, "start", pin);
  if (check.error) return { error: check.error };

  await admin
    .from("bookings")
    .update({ status: "in_progress", started_at: new Date().toISOString() })
    .eq("id", bookingId);
  revalidatePath(`/booking/${bookingId}`);
  return { ok: true };
}

/** Verify the END PIN to complete the job and release the escrow. */
export async function verifyEndPin(
  _prev: JobState,
  formData: FormData,
): Promise<JobState> {
  const bookingId = String(formData.get("booking_id") ?? "");
  const pin = String(formData.get("pin") ?? "").trim();
  const res = await requireSellerBooking(bookingId);
  if ("error" in res) return { error: res.error };
  const { admin, booking } = res;

  if (booking.status !== "in_progress") {
    return { error: "Start the service before ending it." };
  }
  const check = await checkPin(admin, bookingId, "end", pin);
  if (check.error) return { error: check.error };

  const now = new Date();
  // Complete the booking.
  await admin
    .from("bookings")
    .update({ status: "completed", completed_at: now.toISOString() })
    .eq("id", bookingId);

  // Release escrow on the payment.
  await admin
    .from("payments")
    .update({ escrow_status: "released", released_at: now.toISOString() })
    .eq("booking_id", bookingId);

  // Credit the seller's wallet, held until the dispute window closes.
  const availableAt = new Date(
    now.getTime() + HOLD_WINDOW_HOURS * 3600 * 1000,
  ).toISOString();
  await admin.from("wallet_entries").insert({
    seller_id: booking.seller_id,
    booking_id: bookingId,
    type: "earning",
    amount: Number(booking.seller_net ?? 0),
    status: "pending",
    available_at: availableAt,
    note: "Job completed",
  });

  revalidatePath(`/booking/${bookingId}`);
  revalidatePath("/earnings");
  return { ok: true };
}
