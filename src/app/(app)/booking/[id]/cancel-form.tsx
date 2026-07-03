"use client";

import { useActionState, useState } from "react";
import { cancelBooking, type ActionState } from "./booking-actions";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export function CancelForm({
  bookingId,
  note,
}: {
  bookingId: string;
  note: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(
    cancelBooking,
    {},
  );

  if (state.ok) return null;

  if (!open) {
    return (
      <Button
        type="button"
        variant="ghost"
        block
        className="text-danger"
        onClick={() => setOpen(true)}
      >
        Cancel booking
      </Button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="booking_id" value={bookingId} />
      <p className="text-sm text-muted-foreground">{note}</p>
      <textarea
        name="reason"
        rows={2}
        placeholder="Reason (optional)"
        className="w-full rounded-lg border border-border bg-surface p-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
      {state.error ? (
        <p className="flex items-center gap-1.5 text-sm text-danger">
          <Icon name="error" className="text-base" />
          {state.error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="button" variant="secondary" block onClick={() => setOpen(false)}>
          Keep booking
        </Button>
        <Button type="submit" variant="destructive" block disabled={pending}>
          {pending ? "Cancelling" : "Confirm cancel"}
        </Button>
      </div>
    </form>
  );
}
