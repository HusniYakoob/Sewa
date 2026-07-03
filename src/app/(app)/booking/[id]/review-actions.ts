"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ReviewState {
  error?: string;
  ok?: boolean;
}

/** Buyer leaves a rating and comment for a completed booking. */
export async function createReview(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const bookingId = String(formData.get("booking_id") ?? "");
  const sellerId = String(formData.get("seller_id") ?? "");
  const serviceId = String(formData.get("service_id") ?? "");
  const rating = Number(formData.get("rating") ?? 0);
  const comment = String(formData.get("comment") ?? "").trim();

  if (!rating || rating < 1 || rating > 5) {
    return { error: "Pick a rating from 1 to 5 stars." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are signed out." };

  const { error } = await supabase.from("reviews").insert({
    booking_id: bookingId,
    reviewer_id: user.id,
    seller_id: sellerId,
    service_id: serviceId,
    rating,
    comment: comment || null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/booking/${bookingId}`);
  return { ok: true };
}
