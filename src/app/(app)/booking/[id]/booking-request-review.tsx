"use client";

import { useActionState } from "react";
import Link from "next/link";
import { approveBookingRequest, declineBookingRequest, type JobState } from "./seller-actions";
import { Icon } from "@/components/ui/icon";
import { formatLKR } from "@/lib/pricing";

export function BookingRequestReview({
  bookingId,
  buyerName,
  buyerSince,
  serviceTitle,
  packageName,
  scheduledAt,
  durationHours,
  location,
  totalCharged,
  sellerCommission,
  sellerNet,
  planLabel,
}: {
  bookingId: string;
  buyerName: string;
  buyerSince: string | null;
  serviceTitle: string;
  packageName: string | null;
  scheduledAt: string;
  durationHours: number;
  location: string | null;
  totalCharged: number;
  sellerCommission: number;
  sellerNet: number;
  planLabel: string;
}) {
  const [approveState, approveAction, approving] = useActionState<JobState, FormData>(
    approveBookingRequest,
    {},
  );
  const [declineState, declineAction, declining] = useActionState<JobState, FormData>(
    declineBookingRequest,
    {},
  );

  const start = new Date(scheduledAt);
  const end = new Date(start.getTime() + durationHours * 3_600_000);
  const buyerFirstName = buyerName.split(" ")[0];
  const joinedLabel = buyerSince
    ? new Date(buyerSince).toLocaleDateString("en-LK", { month: "short", year: "numeric" })
    : null;
  const area = location?.split(",").pop()?.trim() || location;

  return (
    <div className="flex min-h-dvh flex-col px-[22px] pt-3">
      <div className="flex items-center gap-3.5">
        <Link
          href="/bookings"
          aria-label="Back"
          className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-border bg-surface"
        >
          <Icon name="arrow_back" />
        </Link>
        <p className="text-[17px] font-extrabold">Booking request</p>
      </div>

      <div className="mt-4.5 flex-1 overflow-y-auto">
        <div className="rounded-2xl border-[1.5px] border-border bg-surface p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-full bg-[linear-gradient(135deg,#834DFB,#6B2FE0)] text-[15px] font-extrabold text-white">
              {buyerName
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div className="flex-1">
              <p className="text-[14.5px] font-extrabold">{buyerName}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                New customer{joinedLabel ? ` · joined ${joinedLabel}` : ""}
              </p>
            </div>
          </div>
          <div className="mt-3.5 flex items-center gap-2 rounded-xl bg-brand-tint p-2.5">
            <Icon name="lock" className="text-base text-brand-text" />
            <span className="text-[11.5px] text-muted-foreground">
              Contact details unlock once you confirm this booking.
            </span>
          </div>
        </div>

        <p className="mb-2.5 mt-4.5 text-[11px] font-extrabold tracking-wide text-muted-foreground">
          REQUESTED SERVICE
        </p>
        <div className="rounded-2xl border-[1.5px] border-border bg-surface p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-[13px] bg-brand-tint">
              <Icon name="cleaning_services" className="text-[22px] text-brand-text" />
            </span>
            <div className="flex-1">
              <p className="text-[14.5px] font-extrabold">{serviceTitle}</p>
              {packageName ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{packageName} package</p>
              ) : null}
            </div>
          </div>
          <div className="my-3.5 h-px bg-border" />
          <div className="flex flex-col gap-2">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icon name="calendar_month" className="text-base" />
              {start.toLocaleDateString("en-LK", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}
              {" · "}
              {start.toLocaleTimeString("en-LK", { hour: "numeric", minute: "2-digit" })}
              {" – "}
              {end.toLocaleTimeString("en-LK", { hour: "numeric", minute: "2-digit" })}
            </p>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icon name="location_on" className="text-base" />
              {area ?? "Location"} · exact address after confirmation
            </p>
          </div>
        </div>

        <p className="mb-2.5 mt-4.5 text-[11px] font-extrabold tracking-wide text-muted-foreground">
          YOU&rsquo;LL EARN
        </p>
        <div className="rounded-2xl border-[1.5px] border-border bg-surface p-4">
          <div className="flex justify-between py-1 text-[13px]">
            <span className="text-muted-foreground">Customer pays</span>
            <span className="font-bold">{formatLKR(totalCharged)}</span>
          </div>
          <div className="flex justify-between py-1 text-[13px]">
            <span className="text-muted-foreground">Sewa service fee ({planLabel})</span>
            <span className="font-bold text-danger">− {formatLKR(sellerCommission)}</span>
          </div>
          <div className="my-2.5 h-px bg-border" />
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-extrabold">Your payout</span>
            <span className="text-[17px] font-extrabold text-brand-text">{formatLKR(sellerNet)}</span>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-brand-tint p-3.5">
          <Icon name="info" filled className="mt-0.5 text-base text-brand-text" />
          <span className="text-xs leading-relaxed">
            Confirming lets {buyerFirstName} complete payment. Funds are held safely by Sewa and
            paid out to you once the job is marked complete.
          </span>
        </div>

        {approveState.error ? (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-danger">
            <Icon name="error" className="text-base" />
            {approveState.error}
          </p>
        ) : null}
        {declineState.error ? (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-danger">
            <Icon name="error" className="text-base" />
            {declineState.error}
          </p>
        ) : null}
      </div>

      <div className="flex gap-2.5 pb-[30px] pt-3.5">
        <form action={declineAction} className="flex-1">
          <input type="hidden" name="booking_id" value={bookingId} />
          <button
            type="submit"
            disabled={approving || declining}
            className="w-full rounded-2xl border-[1.5px] border-danger/30 py-4 text-[14.5px] font-extrabold text-danger disabled:opacity-60"
          >
            {declining ? "Declining…" : "Decline"}
          </button>
        </form>
        <form action={approveAction} className="flex-[2]">
          <input type="hidden" name="booking_id" value={bookingId} />
          <button
            type="submit"
            disabled={approving || declining}
            className="w-full rounded-2xl bg-brand py-4 text-[14.5px] font-extrabold text-white shadow-[0_10px_26px_rgba(131,77,251,.3)] disabled:opacity-60"
          >
            {approving ? "Confirming…" : "Confirm booking"}
          </button>
        </form>
      </div>
    </div>
  );
}
