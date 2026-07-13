"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface ReportState {
  error?: string;
}

const CATEGORIES = ["payment", "quality", "safety", "no_show", "other"] as const;

export async function fileReport(
  _prev: ReportState,
  formData: FormData,
): Promise<ReportState> {
  const category = String(formData.get("category") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();
  const bookingId = String(formData.get("booking_id") ?? "") || null;

  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return { error: "Choose a category." };
  }
  if (!subject) return { error: "Tell us what happened." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are signed out." };

  let reportedUserId: string | null = null;
  if (bookingId) {
    const { data: booking } = await supabase
      .from("bookings")
      .select("buyer_id, seller:seller_profiles(user_id)")
      .eq("id", bookingId)
      .maybeSingle();
    if (booking) {
      const sellerUserId = (booking.seller as unknown as { user_id: string } | null)?.user_id;
      reportedUserId = booking.buyer_id === user.id ? (sellerUserId ?? null) : booking.buyer_id;
    }
  }

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    reported_user_id: reportedUserId,
    booking_id: bookingId,
    category,
    subject,
    details: details || null,
  });
  if (error) return { error: error.message };

  redirect("/help/report/sent");
}
