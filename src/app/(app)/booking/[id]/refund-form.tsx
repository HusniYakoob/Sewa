"use client";

import { useActionState, useState } from "react";
import { requestRefund, type ActionState } from "./booking-actions";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";

const REASONS = [
  { value: "quality", label: "Quality issue" },
  { value: "incomplete", label: "Incomplete work" },
  { value: "no_show", label: "No show" },
  { value: "other", label: "Other" },
];

export function RefundForm({ bookingId }: { bookingId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(
    requestRefund,
    {},
  );

  if (state.ok) {
    return (
      <Card className="flex items-center gap-2 border-warning/40">
        <Icon name="hourglass_top" className="text-warning" />
        <p className="text-sm font-medium">Refund requested. An admin will review it.</p>
      </Card>
    );
  }

  if (!open) {
    return (
      <Button type="button" variant="ghost" block onClick={() => setOpen(true)}>
        Request a refund
      </Button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="booking_id" value={bookingId} />
      <select
        name="reason"
        defaultValue="quality"
        className="h-12 w-full rounded-lg border border-border bg-surface px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {REASONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <textarea
        name="explanation"
        rows={3}
        placeholder="What went wrong?"
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
          Cancel
        </Button>
        <Button type="submit" block disabled={pending}>
          {pending ? "Submitting" : "Submit request"}
        </Button>
      </div>
    </form>
  );
}
