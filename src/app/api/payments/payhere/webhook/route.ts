import crypto from "crypto";
import { NextResponse } from "next/server";
import { verifyNotifySignature, PAYHERE_STATUS } from "@/lib/payhere";
import { createAdminClient } from "@/lib/supabase/admin";
import { HOLD_WINDOW_HOURS } from "@/lib/pricing";

export const runtime = "nodejs";

function genPin(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

/**
 * PayHere notify_url. Server-to-server callback after a payment attempt.
 * We verify the signature, and only on status 2 (success) do we confirm the
 * booking, record the payment into escrow with a hold window, and generate the
 * START/END PINs. Idempotent: a retried notification is ignored.
 * Always returns 200 on handled events so PayHere stops retrying.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const p = Object.fromEntries(
    Array.from(form.entries()).map(([k, v]) => [k, String(v)]),
  ) as Record<string, string>;

  const valid = verifyNotifySignature({
    merchant_id: p.merchant_id,
    order_id: p.order_id,
    payhere_amount: p.payhere_amount,
    payhere_currency: p.payhere_currency,
    status_code: p.status_code,
    md5sig: p.md5sig,
  });
  if (!valid) {
    return new NextResponse("invalid signature", { status: 400 });
  }

  // Non-success (pending/cancelled/failed): acknowledge, do nothing.
  if (p.status_code !== PAYHERE_STATUS.SUCCESS) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const bookingId = p.order_id;

  const { data: bookingRow } = await admin
    .from("bookings")
    .select("id, status, buyer_id, seller_id")
    .eq("id", bookingId)
    .maybeSingle();
  const booking = bookingRow as {
    id: string;
    status: string;
    buyer_id: string;
    seller_id: string;
  } | null;

  if (!booking) return NextResponse.json({ ok: true });
  if (booking.status !== "pending") {
    // Already processed. Idempotent no-op.
    return NextResponse.json({ ok: true });
  }

  const now = new Date();
  const holdUntil = new Date(
    now.getTime() + HOLD_WINDOW_HOURS * 3600 * 1000,
  ).toISOString();

  await admin
    .from("bookings")
    .update({ status: "accepted", accepted_at: now.toISOString() })
    .eq("id", bookingId);

  const { data: payment } = await admin
    .from("payments")
    .insert({
      booking_id: bookingId,
      buyer_id: booking.buyer_id,
      seller_id: booking.seller_id,
      amount: Number(p.payhere_amount),
      currency: p.payhere_currency || "LKR",
      status: "succeeded",
      escrow_status: "held",
      payhere_order_id: bookingId,
      payhere_payment_id: p.payment_id ?? null,
      payment_method: p.method ?? null,
      hold_until: holdUntil,
    })
    .select("id")
    .single();

  await admin.from("booking_pins").insert({
    booking_id: bookingId,
    start_pin: genPin(),
    end_pin: genPin(),
  });

  await admin.from("payment_logs").insert({
    payment_id: (payment as { id: string } | null)?.id ?? null,
    event_type: "webhook_succeeded",
    new_status: "succeeded",
    metadata: p,
  });

  return NextResponse.json({ ok: true });
}
