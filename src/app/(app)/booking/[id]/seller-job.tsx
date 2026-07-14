"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import {
  markArrived,
  verifyStartPin,
  verifyEndPin,
  type JobState,
} from "./seller-actions";
import { CancelForm } from "./cancel-form";
import { Icon } from "@/components/ui/icon";
import { formatLKR } from "@/lib/pricing";
import type { BookingStatus } from "@/lib/supabase/types";

export function SellerJob({
  bookingId,
  status,
  sellerApprovedAt,
  title,
  scheduledAt,
  startedAt,
  location,
  notes,
  sellerNet,
  buyerName,
  buyerPhone,
}: {
  bookingId: string;
  status: BookingStatus;
  sellerApprovedAt: string | null;
  title: string;
  scheduledAt: string;
  startedAt: string | null;
  location: string | null;
  notes: string | null;
  sellerNet: number;
  buyerName: string;
  buyerPhone: string | null;
}) {
  const buyerFirstName = buyerName.split(" ")[0];
  const showBuyerCard = ["accepted", "arrived", "in_progress"].includes(status);

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
        <p className="flex-1 text-[16px] font-extrabold">
          {status === "in_progress" || status === "arrived" ? "Active job" : "Job"}
        </p>
        {buyerPhone ? (
          <Link
            href={`/chats`}
            aria-label="Message customer"
            className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-border bg-surface"
          >
            <Icon name="chat_bubble" className="text-brand-text" />
          </Link>
        ) : null}
      </div>

      {showBuyerCard ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#1B1C2B] p-4">
          <span className="h-11 w-11 flex-none rounded-2xl bg-[#3A3352]" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate text-[14.5px] font-extrabold text-white">
              {buyerName}
            </p>
            <p className="mt-0.5 truncate text-xs text-[#9A96AB]">
              {title}
              {location ? ` · ${location}` : ""}
            </p>
          </div>
          {buyerPhone ? (
            <a
              href={`tel:${buyerPhone}`}
              className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[#302A47]"
            >
              <Icon name="call" className="text-[#B69BFF]" />
            </a>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border-[1.5px] border-border bg-surface p-4">
          <p className="font-extrabold">{title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {new Date(scheduledAt).toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" })}
            {location ? ` · ${location}` : ""}
          </p>
          {notes ? <p className="mt-2 text-sm">{notes}</p> : null}
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <span className="text-sm text-muted-foreground">You earn</span>
            <span className="font-mono font-semibold tabular-nums">{formatLKR(sellerNet)}</span>
          </div>
        </div>
      )}

      <div className="flex-1">
        {status === "pending" && sellerApprovedAt ? (
          <div className="mt-4">
            <Info icon="schedule" text="Waiting for the customer to pay. You'll see this as confirmed once payment is done." />
          </div>
        ) : null}

        {status === "accepted" ? (
          <div className="mt-4">
            <ArrivedForm bookingId={bookingId} />
          </div>
        ) : null}

        {status === "arrived" ? (
          <div className="mt-4">
            <PinForm
              bookingId={bookingId}
              action={verifyStartPin}
              label="Ask the customer for the START PIN"
              cta="Start service"
            />
          </div>
        ) : null}

        {status === "in_progress" ? (
          <>
            <LiveTimer startedAt={startedAt} />
            <div className="mt-3.5 flex items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-brand/40 bg-surface p-4">
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-brand-tint">
                <Icon name="lock" filled className="text-[23px] text-brand-text" />
              </span>
              <div className="flex-1">
                <p className="text-[13.5px] font-extrabold">
                  {formatLKR(sellerNet)} — payment protected
                </p>
                <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                  Enter {buyerFirstName}&rsquo;s END PIN to release it
                </p>
              </div>
            </div>
            <div className="mt-4">
              <PinForm
                bookingId={bookingId}
                action={verifyEndPin}
                label="Job done? Ask for the END PIN"
                cta="I'm finished — enter END PIN"
              />
            </div>
          </>
        ) : null}

        {status === "completed" ? (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border-[1.5px] border-success/30 bg-success/5 p-4">
            <Icon name="check_circle" filled className="text-2xl text-success" />
            <p className="text-sm font-bold">
              Completed. {formatLKR(sellerNet)} added to your held balance.
            </p>
          </div>
        ) : null}

        {status === "cancelled" || status === "declined" ? (
          <div className="mt-4">
            <Info icon="cancel" text="This booking is closed." />
          </div>
        ) : null}
      </div>

      {status === "accepted" || status === "arrived" ? (
        <div className="pb-[30px] pt-4">
          <CancelForm
            bookingId={bookingId}
            note="If you cancel, the customer is fully refunded and you receive a strike."
          />
        </div>
      ) : (
        <div className="pb-6" />
      )}
    </div>
  );
}

function LiveTimer({ startedAt }: { startedAt: string | null }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const startMs = startedAt ? new Date(startedAt).getTime() : now;
  const elapsedSec = Math.max(0, Math.floor((now - startMs) / 1000));
  const h = Math.floor(elapsedSec / 3600);
  const m = Math.floor((elapsedSec % 3600) / 60);
  const s = elapsedSec % 60;
  const label = `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

  return (
    <div className="relative mt-4 overflow-hidden rounded-[22px] bg-[linear-gradient(135deg,#834dfb,#6b2fe0)] p-5">
      <div className="pointer-events-none absolute -right-6 -top-6 h-[110px] w-[110px] rounded-full bg-white/10" />
      <div className="relative flex items-center justify-between">
        <div>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#3DDC84]" />
            <span className="text-[11px] font-extrabold tracking-wide text-[#E4D9FB]">
              IN PROGRESS
            </span>
          </span>
          <p className="mt-1.5 font-mono text-[34px] font-extrabold tracking-tight text-white tabular-nums">
            {label}
          </p>
        </div>
        {startedAt ? (
          <div className="text-right">
            <p className="text-[11px] text-[#D9C9FF]">
              Started{" "}
              {new Date(startedAt).toLocaleTimeString("en-LK", { hour: "numeric", minute: "2-digit" })}
            </p>
            <p className="mt-1 flex items-center justify-end gap-1 text-[11px] font-bold text-accent">
              <Icon name="lock_open" filled className="text-sm" />
              START verified
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Info({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border-[1.5px] border-border bg-surface p-4">
      <Icon name={icon} className="text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
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
      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-[15px] font-extrabold text-white shadow-[0_10px_26px_rgba(131,77,251,.3)] disabled:opacity-60"
      >
        <Icon name="location_on" className="text-lg" />
        {pending ? "Please wait…" : "I have arrived"}
      </button>
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
      <label htmlFor="pin" className="text-[13px] font-bold text-foreground">
        {label}
      </label>
      <input type="hidden" name="booking_id" value={bookingId} />
      <input
        id="pin"
        name="pin"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        placeholder="6-digit PIN"
        required
        className="h-14 w-full rounded-2xl border-[1.5px] border-border bg-surface text-center font-mono text-lg tracking-[0.3em] focus-visible:border-brand focus-visible:outline-none"
      />
      {state.error ? <ErrorLine text={state.error} /> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-brand py-4 text-[15px] font-extrabold text-white shadow-[0_10px_26px_rgba(131,77,251,.3)] disabled:opacity-60"
      >
        {pending ? "Verifying…" : cta}
      </button>
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
