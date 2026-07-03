"use client";

import { useActionState, useState } from "react";
import { createReview, type ReviewState } from "./review-actions";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ReviewForm({
  bookingId,
  sellerId,
  serviceId,
}: {
  bookingId: string;
  sellerId: string;
  serviceId: string;
}) {
  const [rating, setRating] = useState(0);
  const [state, action, pending] = useActionState<ReviewState, FormData>(
    createReview,
    {},
  );

  if (state.ok) {
    return (
      <Card className="flex items-center gap-2 border-success/40">
        <Icon name="check_circle" filled className="text-success" />
        <p className="text-sm font-medium">Thanks for your review.</p>
      </Card>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="booking_id" value={bookingId} />
      <input type="hidden" name="seller_id" value={sellerId} />
      <input type="hidden" name="service_id" value={serviceId} />
      <input type="hidden" name="rating" value={rating} />

      <p className="text-sm font-semibold">Rate your provider</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className="p-1"
          >
            <Icon
              name="star"
              filled={n <= rating}
              className={cn(
                "text-3xl",
                n <= rating ? "text-warning" : "text-muted-foreground",
              )}
            />
          </button>
        ))}
      </div>

      <textarea
        name="comment"
        rows={3}
        placeholder="How did it go? (optional)"
        className="w-full rounded-lg border border-border bg-surface p-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />

      {state.error ? (
        <p className="flex items-center gap-1.5 text-sm text-danger">
          <Icon name="error" className="text-base" />
          {state.error}
        </p>
      ) : null}

      <Button type="submit" block disabled={pending || rating === 0}>
        {pending ? "Submitting" : "Submit review"}
      </Button>
    </form>
  );
}
