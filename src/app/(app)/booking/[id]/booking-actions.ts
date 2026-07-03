"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cancellationFee } from "@/lib/pricing";

export interface ActionState {
  error?: string;
  ok?: boolean;
}

const CANCELLABLE = ["pending", "accepted", "arrived"];

/** Cancel a booking. Buyer cancels pay a lateness fee; seller cancels refund
 *  the buyer fully and take a strike. Runs with the service role after
 *  confirming the caller is a party to the booking. */
export async function cancelBooking(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const bookingId = String(formData.get("booking_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are signed out." };

  const { data: sp } = await supabase
    .from("seller_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  const sellerId = (sp as { id: string } | null)?.id ?? null;

  const admin = createAdminClient();
  const { data: bRow } = await admin
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle();
  const booking = bRow as Record<string, unknown> | null;
  if (!booking) return { error: "Booking not found." };

  const isBuyer = booking.buyer_id === user.id;
  const isSeller = sellerId != null && booking.seller_id === sellerId;
  if (!isBuyer && !isSeller) return { error: "This is not your booking." };
  if (!CANCELLABLE.includes(booking.status as string)) {
    return { error: "This booking can no longer be cancelled." };
  }

  const now = new Date().toISOString();
  let fee = 0;

  // Only paid bookings involve money; a pending (unpaid) one just closes.
  if (booking.status !== "pending") {
    fee = cancellationFee(
      Number(booking.total_charged),
      new Date(booking.scheduled_at as string).getTime(),
      { arrived: booking.status === "arrived", bySeller: isSeller },
    );
    const refundAmount = Number(booking.total_charged) - fee;

    const { data: pay } = await admin
      .from("payments")
      .select("id")
      .eq("booking_id", bookingId)
      .maybeSingle();
    const paymentId = (pay as { id: string } | null)?.id;

    if (paymentId && refundAmount > 0) {
      await admin.from("refunds").insert({
        payment_id: paymentId,
        booking_id: bookingId,
        requester_id: user.id,
        amount: refundAmount,
        reason: "other",
        explanation: `Cancelled by ${isSeller ? "provider" : "customer"}${reason ? `: ${reason}` : ""}`,
        status: "pending",
        refund_method: "original",
      });
    }

    if (isSeller) {
      const { data: spRow } = await admin
        .from("seller_profiles")
        .select("strikes")
        .eq("id", sellerId as string)
        .maybeSingle();
      const strikes = Number((spRow as { strikes: number } | null)?.strikes ?? 0) + 1;
      await admin
        .from("seller_profiles")
        .update({ strikes })
        .eq("id", sellerId as string);
    }
  }

  await admin
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_at: now,
      cancelled_by: isSeller ? "seller" : "buyer",
      cancel_reason: reason || null,
      cancellation_fee: fee,
    })
    .eq("id", bookingId);

  revalidatePath(`/booking/${bookingId}`);
  return { ok: true };
}

/** Buyer requests a refund on a completed booking (dispute). */
export async function requestRefund(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const bookingId = String(formData.get("booking_id") ?? "");
  const reason = String(formData.get("reason") ?? "other");
  const explanation = String(formData.get("explanation") ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are signed out." };

  const { data: bRow } = await supabase
    .from("bookings")
    .select("id, status, total_charged")
    .eq("id", bookingId)
    .maybeSingle();
  const booking = bRow as {
    id: string;
    status: string;
    total_charged: number;
  } | null;
  if (!booking || booking.status !== "completed") {
    return { error: "Refunds can only be requested on completed jobs." };
  }

  const { data: pay } = await supabase
    .from("payments")
    .select("id")
    .eq("booking_id", bookingId)
    .maybeSingle();
  const paymentId = (pay as { id: string } | null)?.id;
  if (!paymentId) return { error: "Payment not found." };

  const { error } = await supabase.from("refunds").insert({
    payment_id: paymentId,
    booking_id: bookingId,
    requester_id: user.id,
    amount: booking.total_charged,
    reason,
    explanation: explanation || null,
    status: "pending",
    refund_method: "original",
  });
  if (error) return { error: error.message };

  revalidatePath(`/booking/${bookingId}`);
  return { ok: true };
}
