"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeFees } from "@/lib/pricing";

export interface BookingState {
  error?: string;
}

/** Create a booking (status pending) from a chosen package, then send the buyer to pay. */
export async function createBooking(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const serviceId = String(formData.get("service_id") ?? "");
  const packageId = String(formData.get("package_id") ?? "");
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const location = String(formData.get("location") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!serviceId || !packageId || !date || !time || !location) {
    return { error: "Pick a date, time and address." };
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
    .select("id, seller_id, status, seller:seller_profiles(commission_rate)")
    .eq("id", serviceId)
    .maybeSingle();
  const service = svc as {
    seller_id: string;
    status: string;
    seller: { commission_rate: number } | null;
  } | null;

  if (!service || service.status !== "active") {
    return { error: "This service is not available." };
  }

  const { data: pkg } = await supabase
    .from("service_packages")
    .select("id, price")
    .eq("id", packageId)
    .eq("service_id", serviceId)
    .maybeSingle();
  if (!pkg) return { error: "Choose a package." };

  const commissionRate = Number(service.seller?.commission_rate ?? 0.1);
  const serviceAmount = Number(pkg.price);
  const fees = computeFees(serviceAmount, commissionRate);

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      buyer_id: user.id,
      seller_id: service.seller_id,
      service_id: serviceId,
      package_id: packageId,
      status: "pending",
      scheduled_at: scheduledAt.toISOString(),
      duration_hours: 1,
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
