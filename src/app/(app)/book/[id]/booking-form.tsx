"use client";

import { useActionState, useState } from "react";
import { createBooking, type BookingState } from "./actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { computeFees, formatLKR } from "@/lib/pricing";

export function BookingForm({
  serviceId,
  title,
  price,
  priceUnit,
  area,
}: {
  serviceId: string;
  title: string;
  price: number;
  priceUnit: string;
  area: string | null;
}) {
  const [duration, setDuration] = useState(1);
  const [state, action, pending] = useActionState<BookingState, FormData>(
    createBooking,
    {},
  );

  const serviceAmount = priceUnit === "hour" ? price * duration : price;
  const fees = computeFees(serviceAmount);

  return (
    <form action={action} className="flex flex-col gap-4 p-4">
      <input type="hidden" name="service_id" value={serviceId} />

      <Card>
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {formatLKR(price)} / {priceUnit}
          {area ? ` · ${area}` : ""}
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" htmlFor="date">
          <Input id="date" name="date" type="date" required />
        </Field>
        <Field label="Time" htmlFor="time">
          <Input id="time" name="time" type="time" required />
        </Field>
      </div>

      {priceUnit === "hour" ? (
        <Field label="Hours" htmlFor="duration">
          <Input
            id="duration"
            name="duration"
            type="number"
            min="1"
            step="1"
            value={duration}
            onChange={(e) => setDuration(Math.max(1, Number(e.target.value) || 1))}
          />
        </Field>
      ) : (
        <input type="hidden" name="duration" value={1} />
      )}

      <Field label="Address" htmlFor="location" hint="Where the provider should come.">
        <Input id="location" name="location" placeholder="Colombo 04" />
      </Field>

      <Field label="Notes (optional)" htmlFor="notes">
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Anything the provider should know."
          className="w-full rounded-lg border border-border bg-surface p-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </Field>

      <Card>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">
              Service{priceUnit === "hour" ? ` (${duration}h)` : ""}
            </dt>
            <dd className="font-mono tabular-nums">{formatLKR(fees.serviceAmount)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Service fee (5%)</dt>
            <dd className="font-mono tabular-nums">{formatLKR(fees.buyerFee)}</dd>
          </div>
          <div className="mt-1 flex items-center justify-between border-t border-border pt-2">
            <dt className="font-semibold">Total</dt>
            <dd className="font-mono font-semibold tabular-nums">
              {formatLKR(fees.totalCharged)}
            </dd>
          </div>
        </dl>
      </Card>

      {state.error ? (
        <p className="flex items-center gap-1.5 text-sm text-danger">
          <Icon name="error" className="text-base" />
          {state.error}
        </p>
      ) : null}

      <Button type="submit" block disabled={pending}>
        <Icon name="lock" /> {pending ? "Please wait" : "Continue to payment"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Payment is held securely until the job is done.
      </p>
    </form>
  );
}
