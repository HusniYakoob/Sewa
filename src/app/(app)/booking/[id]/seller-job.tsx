"use client";

import { useActionState } from "react";
import {
  markArrived,
  verifyStartPin,
  verifyEndPin,
  approveBookingRequest,
  declineBookingRequest,
  type JobState,
} from "./seller-actions";
import { CancelForm } from "./cancel-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { formatLKR } from "@/lib/pricing";
import type { BookingStatus } from "@/lib/supabase/types";

export function SellerJob({
  bookingId,
  status,
  sellerApprovedAt,
  title,
  scheduledAt,
  location,
  notes,
  sellerNet,
}: {
  bookingId: string;
  status: BookingStatus;
  sellerApprovedAt: string | null;
  title: string;
  scheduledAt: string;
  location: string | null;
  notes: string | null;
  sellerNet: number;
}) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Card>
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {new Date(scheduledAt).toLocaleString("en-LK", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
          {location ? ` · ${location}` : ""}
        </p>
        {notes ? <p className="mt-2 text-sm">{notes}</p> : null}
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm text-muted-foreground">You earn</span>
          <span className="font-mono font-semibold tabular-nums">
            {formatLKR(sellerNet)}
          </span>
        </div>
      </Card>

      {status === "pending" && !sellerApprovedAt ? (
        <RequestDecisionForm bookingId={bookingId} />
      ) : null}

      {status === "pending" && sellerApprovedAt ? (
        <Info icon="schedule" text="Waiting for the customer to pay. You'll see this as confirmed once payment is done." />
      ) : null}

      {status === "accepted" ? (
        <ArrivedForm bookingId={bookingId} />
      ) : null}

      {status === "arrived" ? (
        <PinForm
          bookingId={bookingId}
          action={verifyStartPin}
          label="Ask the customer for the START PIN"
          cta="Start service"
        />
      ) : null}

      {status === "in_progress" ? (
        <PinForm
          bookingId={bookingId}
          action={verifyEndPin}
          label="Job done? Ask for the END PIN"
          cta="Complete and get paid"
        />
      ) : null}

      {status === "completed" ? (
        <Card className="flex items-center gap-2 border-success/40">
          <Icon name="check_circle" filled className="text-success" />
          <p className="text-sm font-medium">
            Completed. {formatLKR(sellerNet)} added to your held balance.
          </p>
        </Card>
      ) : null}

      {status === "cancelled" || status === "declined" ? (
        <Info icon="cancel" text="This booking is closed." />
      ) : null}

      {status === "accepted" || status === "arrived" ? (
        <CancelForm
          bookingId={bookingId}
          note="If you cancel, the customer is fully refunded and you receive a strike."
        />
      ) : null}
    </div>
  );
}

function Info({ icon, text }: { icon: string; text: string }) {
  return (
    <Card className="flex items-center gap-2">
      <Icon name={icon} className="text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </Card>
  );
}

function RequestDecisionForm({ bookingId }: { bookingId: string }) {
  const [approveState, approveAction, approving] = useActionState<JobState, FormData>(
    approveBookingRequest,
    {},
  );
  const [declineState, declineAction, declining] = useActionState<JobState, FormData>(
    declineBookingRequest,
    {},
  );

  return (
    <Card className="flex flex-col gap-3">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Icon name="schedule_send" className="text-brand-text" />
        New booking request — no charge to the customer until you decide.
      </p>
      {approveState.error ? <ErrorLine text={approveState.error} /> : null}
      {declineState.error ? <ErrorLine text={declineState.error} /> : null}
      <div className="flex gap-2.5">
        <form action={declineAction} className="flex-1">
          <input type="hidden" name="booking_id" value={bookingId} />
          <Button type="submit" variant="ghost" block disabled={declining || approving} className="text-danger">
            {declining ? "Declining…" : "Decline"}
          </Button>
        </form>
        <form action={approveAction} className="flex-1">
          <input type="hidden" name="booking_id" value={bookingId} />
          <Button type="submit" block disabled={declining || approving}>
            {approving ? "Confirming…" : "Confirm"}
          </Button>
        </form>
      </div>
    </Card>
  );
}

function ArrivedForm({ bookingId }: { bookingId: string }) {
  const [state, action, pending] = useActionState<JobState, FormData>(
    markArrived,
    {},
  );
  return (
    <form action={action}>
      <input type="hidden" name="booking_id" value={bookingId} />
      {state.error ? <ErrorLine text={state.error} /> : null}
      <Button type="submit" block disabled={pending}>
        <Icon name="location_on" /> {pending ? "Please wait" : "I have arrived"}
      </Button>
    </form>
  );
}

function PinForm({
  bookingId,
  action,
  label,
  cta,
}: {
  bookingId: string;
  action: (prev: JobState, formData: FormData) => Promise<JobState>;
  label: string;
  cta: string;
}) {
  const [state, formAction, pending] = useActionState<JobState, FormData>(
    action,
    {},
  );
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label htmlFor="pin" className="text-sm font-medium">
        {label}
      </label>
      <input type="hidden" name="booking_id" value={bookingId} />
      <Input
        id="pin"
        name="pin"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        placeholder="6-digit PIN"
        className="text-center font-mono text-lg tracking-[0.3em]"
        required
      />
      {state.error ? <ErrorLine text={state.error} /> : null}
      <Button type="submit" block disabled={pending}>
        {pending ? "Verifying" : cta}
      </Button>
    </form>
  );
}

function ErrorLine({ text }: { text: string }) {
  return (
    <p className="flex items-center gap-1.5 text-sm text-danger">
      <Icon name="error" className="text-base" />
      {text}
    </p>
  );
}
