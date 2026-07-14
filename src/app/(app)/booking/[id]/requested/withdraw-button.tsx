"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { cancelBooking, type ActionState } from "../booking-actions";

export function WithdrawButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<ActionState, FormData>(
    cancelBooking,
    {},
  );

  useEffect(() => {
    if (state.ok) router.replace("/bookings");
  }, [state.ok, router]);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Withdraw this booking request?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="booking_id" value={bookingId} />
      <button
        type="submit"
        disabled={pending}
        className="w-full text-center text-[13px] font-extrabold text-danger disabled:opacity-60"
      >
        {pending ? "Withdrawing…" : "Withdraw request"}
      </button>
    </form>
  );
}
