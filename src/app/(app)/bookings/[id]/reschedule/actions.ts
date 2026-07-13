"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface RescheduleState {
  error?: string;
}

/** Propose a new time for a booking; the pro must confirm before it changes. */
export async function requestReschedule(
  _prev: RescheduleState,
  formData: FormData,
): Promise<RescheduleState> {
  const bookingId = String(formData.get("booking_id") ?? "");
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!bookingId || !date || !time) return { error: "Pick a new date and time." };
  const proposed = new Date(`${date}T${time}`);
  if (Number.isNaN(proposed.getTime()) || proposed.getTime() < Date.now()) {
    return { error: "Choose a future date and time." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are signed out." };

  const { error } = await supabase
    .from("bookings")
    .update({
      reschedule_proposed_at: proposed.toISOString(),
      reschedule_requested_by: "buyer",
      reschedule_note: note || null,
    })
    .eq("id", bookingId)
    .eq("buyer_id", user.id);
  if (error) return { error: error.message };

  revalidatePath(`/booking/${bookingId}`);
  revalidatePath("/bookings");
  redirect("/bookings");
}
