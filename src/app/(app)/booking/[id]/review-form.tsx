"use client";

import { useActionState, useState } from "react";
import { createReview, type ReviewState } from "./review-actions";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TAGS = ["On time", "Great work", "Friendly", "Would rebook"];

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
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
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

  function toggleTag(tag: string) {
    setTags((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]));
  }

  const combinedComment = [comment.trim(), tags.length ? tags.join(", ") : ""]
    .filter(Boolean)
    .join(" — ");

  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl border-[1.5px] border-border bg-surface p-5">
      <input type="hidden" name="booking_id" value={bookingId} />
      <input type="hidden" name="seller_id" value={sellerId} />
      <input type="hidden" name="service_id" value={serviceId} />
      <input type="hidden" name="rating" value={rating} />
      <input type="hidden" name="comment" value={combinedComment} />

      <p className="text-center text-[15px] font-extrabold">How was your provider?</p>
      <div className="flex justify-center gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className="p-0.5 transition active:scale-110"
          >
            <Icon
              name="star"
              filled={n <= rating}
              className={cn(
                "text-4xl",
                n <= rating ? "text-[#EAB308]" : "text-muted-foreground/40",
              )}
            />
          </button>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {TAGS.map((tag) => {
          const active = tags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={cn(
                "rounded-full border-2 px-3.5 py-2 text-xs font-extrabold transition",
                active
                  ? "border-brand bg-brand-tint text-brand-text"
                  : "border-border bg-surface text-muted-foreground",
              )}
            >
              {tag}
            </button>
          );
        })}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Add a note for other buyers…"
        className="w-full rounded-2xl border-[1.5px] border-border bg-background p-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />

      <div className="flex items-start gap-2 rounded-2xl bg-brand-tint px-3.5 py-3">
        <Icon name="schedule" filled className="mt-0.5 text-base text-brand-text" />
        <p className="text-xs leading-relaxed">
          Payment releases from escrow after the <b>72-hour dispute window</b>.
        </p>
      </div>

      {state.error ? (
        <p className="flex items-center gap-1.5 text-sm text-danger">
          <Icon name="error" className="text-base" />
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" block disabled={pending || rating === 0}>
        {pending ? "Submitting" : "Submit review"}
      </Button>
    </form>
  );
}
