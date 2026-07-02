"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeFees } from "@/lib/pricing";

export interface BookingState {
  error?: string;
}

/** Create a booking (status pending) and send the buyer to the payment step. */
export async function createBooking(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const serviceId = String(formData.get("service_id") ?? "");
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const duration = Number(formData.get("duration") ?? 1) || 1;
  const location = String(formData.get("location") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!serviceId || !date || !time) {
    return { error: "Pick a date and time." };
  }
  const scheduledAt = new Date(`${date}T${time}`);
  if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() < Date.now()) {
    return { error: "Choose a future date and time." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are signed out." };

  const { data: svc } = await supabase
    .from("services")
    .select(
      "id, price, price_unit, seller_id, status, seller:seller_profiles(commission_rate)",
    )
    .eq("id", serviceId)
    .maybeSingle();
  const service = svc as {
    price: number;
    price_unit: string;
    seller_id: string;
    status: string;
    seller: { commission_rate: number } | null;
  } | null;

  if (!service || service.status !== "active") {
    return { error: "This service is not available." };
  }

  const commissionRate = Number(service.seller?.commission_rate ?? 0.1);
  const serviceAmount =
    service.price_unit === "hour"
      ? Number(service.price) * duration
      : Number(service.price);
  const fees = computeFees(serviceAmount, commissionRate);

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      buyer_id: user.id,
      seller_id: service.seller_id,
      service_id: serviceId,
      status: "pending",
      scheduled_at: scheduledAt.toISOString(),
      duration_hours: duration,
      location: location || null,
      notes: notes || null,
      service_amount: fees.serviceAmount,
      buyer_fee: fees.buyerFee,
      total_charged: fees.totalCharged,
      seller_commission: fees.sellerCommission,
      guarantee_reserve: fees.guaranteeReserve,
      seller_net: fees.sellerNet,
      platform_net: fees.platformNet,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  redirect(`/pay/${(booking as { id: string }).id}`);
}
