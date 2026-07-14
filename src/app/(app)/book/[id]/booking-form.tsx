"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { createBooking, type BookingState } from "./actions";
import { Icon } from "@/components/ui/icon";
import { formatLKR } from "@/lib/pricing";
import { computeFees } from "@/lib/pricing";
import { cn } from "@/lib/utils";

const AM_SLOTS = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM"];
const PM_SLOTS = ["12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];
const DOW = ["S", "M", "T", "W", "T", "F", "S"];
const INCLUDED = [
  "Vetted, NIC-verified providers",
  "Payment held safely until you confirm",
  "Free cancellation up to 24h before",
  "Covered by the Sewa Guarantee",
];

function buildMonth(monthOffset: number) {
  const base = new Date();
  const first = new Date(base.getFullYear(), base.getMonth() + monthOffset, 1);
  const days: (Date | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) days.push(null);
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(first.getFullYear(), first.getMonth(), d));
  }
  return { label: first.toLocaleDateString("en-LK", { month: "long", year: "numeric" }), days };
}

function to24Hour(slot: string): string {
  const [time, meridiem] = slot.split(" ");
  const [h, m] = time.split(":").map(Number);
  let hour = h % 12;
  if (meridiem === "PM") hour += 12;
  return `${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function BookingForm({
  serviceId,
  title,
  area,
  packageId,
  packageName,
  price,
  sellerName,
  sellerVerified,
  sellerRating,
  sellerReviews,
}: {
  serviceId: string;
  title: string;
  area: string | null;
  packageId: string | null;
  packageName: string | null;
  price: number;
  sellerName: string;
  sellerVerified: boolean;
  sellerRating: number;
  sellerReviews: number;
}) {
  const [step, setStep] = useState<"schedule" | "review">("schedule");
  const [monthOffset, setMonthOffset] = useState(0);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [location, setLocation] = useState(area ?? "");
  const [state, action, pending] = useActionState<BookingState, FormData>(
    createBooking,
    {},
  );

  const { label, days } = useMemo(() => buildMonth(monthOffset), [monthOffset]);
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const isoDate = date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    : "";
  const time24 = time ? to24Hour(time) : "";
  const canContinue = Boolean(date && time && location.trim());

  const scheduledAt = useMemo(() => {
    if (!date || !time24) return null;
    const [h, m] = time24.split(":").map(Number);
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    return d;
  }, [date, time24]);

  const fees = useMemo(() => computeFees(price), [price]);
  const cancelDeadline = useMemo(() => {
    if (!scheduledAt) return null;
    const d = new Date(scheduledAt);
    d.setHours(d.getHours() - 24);
    return d;
  }, [scheduledAt]);

  if (step === "review" && scheduledAt) {
    return (
      <form action={action} className="flex min-h-dvh flex-col px-[22px] pb-24 pt-3">
        <input type="hidden" name="service_id" value={serviceId} />
        <input type="hidden" name="package_id" value={packageId ?? ""} />
        <input type="hidden" name="date" value={isoDate} />
        <input type="hidden" name="time" value={time24} />
        <input type="hidden" name="location" value={location} />

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setStep("schedule")}
            aria-label="Back"
            className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full border border-border bg-surface"
          >
            <Icon name="arrow_back" />
          </button>
          <p className="flex-1 text-[17px] font-extrabold">Review &amp; request</p>
          <span className="text-xs font-extrabold text-brand-text">3 / 3</span>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto">
          <div className="rounded-2xl border-[1.5px] border-border bg-surface p-4">
            <div className="flex items-center gap-3">
              <span className="h-[46px] w-[46px] flex-none rounded-2xl bg-brand-tint" />
              <div className="flex-1">
                <p className="flex items-center gap-1.5 text-sm font-extrabold">
                  {sellerName}
                  {sellerVerified ? (
                    <Icon name="verified" filled className="text-sm text-brand-text" />
                  ) : null}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {title}
                  {packageName ? ` · ${packageName}` : ""} · {sellerRating.toFixed(1)}{" "}
                  <Icon name="star" filled className="inline text-xs text-[#EAB308]" /> (
                  {sellerReviews})
                </p>
              </div>
            </div>
            <div className="my-3.5 h-px bg-border" />
            <div className="flex flex-col gap-2">
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon name="calendar_month" className="text-base" />
                {scheduledAt.toLocaleDateString("en-LK", {
                  weekday: "long",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}{" "}
                ·{" "}
                {scheduledAt.toLocaleTimeString("en-LK", { hour: "numeric", minute: "2-digit" })}
              </p>
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon name="location_on" className="text-base" />
                {location}
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-2xl border-[1.5px] border-border bg-surface p-4">
            <p className="mb-2.5 text-[11px] font-extrabold tracking-wide text-muted-foreground">
              WHAT&rsquo;S INCLUDED
            </p>
            <div className="flex flex-col gap-2">
              {INCLUDED.map((it) => (
                <div key={it} className="flex items-start gap-2">
                  <Icon name="check_circle" filled className="mt-0.5 text-base text-success" />
                  <span className="text-xs leading-relaxed">{it}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 rounded-2xl border-[1.5px] border-border bg-surface p-4">
            <p className="mb-2.5 text-[11px] font-extrabold tracking-wide text-muted-foreground">
              PRICE BREAKDOWN
            </p>
            <div className="flex justify-between py-1 text-[13.5px]">
              <span className="text-muted-foreground">
                {packageName ?? "Service"}
              </span>
              <span className="font-bold">{formatLKR(fees.serviceAmount)}</span>
            </div>
            <div className="flex justify-between py-1 text-[13.5px]">
              <span className="text-muted-foreground">Service fee (5%)</span>
              <span className="font-bold">{formatLKR(fees.buyerFee)}</span>
            </div>
            <div className="my-2.5 h-px bg-border" />
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-extrabold">Total</span>
              <span className="text-lg font-extrabold text-brand-text">
                {formatLKR(fees.totalCharged)}
              </span>
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-brand-tint p-3">
              <Icon name="info" filled className="mt-0.5 text-base text-brand-text" />
              <span className="text-xs leading-relaxed">
                You won&rsquo;t be charged yet — {sellerName.split(" ")[0]} confirms first, then
                your card is charged and payment is held safely until the job is done.
              </span>
            </div>
          </div>

          {cancelDeadline ? (
            <div className="mt-3 rounded-2xl border-[1.5px] border-border bg-surface p-4">
              <p className="flex items-center gap-2 text-[13px] font-extrabold">
                <Icon name="event_busy" className="text-base text-muted-foreground" />
                Cancellation policy
              </p>
              <div className="mt-2.5 flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    Before{" "}
                    {cancelDeadline.toLocaleDateString("en-LK", { weekday: "short", day: "numeric", month: "short" })}
                    , {cancelDeadline.toLocaleTimeString("en-LK", { hour: "numeric", minute: "2-digit" })}
                  </span>
                  <span className="font-extrabold text-success">Free</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Within 24 hours of the slot</span>
                  <span className="font-extrabold text-warning">25% fee</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">After {sellerName.split(" ")[0]} arrives</span>
                  <span className="font-extrabold text-danger">50% fee</span>
                </div>
              </div>
            </div>
          ) : null}

          {state.error ? (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-danger">
              <Icon name="error" className="text-base" />
              {state.error}
            </p>
          ) : null}
        </div>

        <div className="pt-3">
          <button
            type="submit"
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-[15.5px] font-extrabold text-white shadow-[0_12px_26px_rgba(131,77,251,.35)] transition active:scale-[.97] disabled:opacity-60"
          >
            <Icon name="send" className="text-lg" />
            {pending ? "Sending…" : "Send booking request"}
          </button>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
            Your card is only charged if {sellerName.split(" ")[0]} confirms. By continuing you
            agree to Sewa&rsquo;s Terms and the cancellation policy above.
          </p>
        </div>
      </form>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col px-[22px] pb-24 pt-3">
      <div className="flex items-center gap-3">
        <Link
          href={`/service/${serviceId}`}
          aria-label="Back"
          className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full border border-border bg-surface"
        >
          <Icon name="arrow_back" />
        </Link>
        <p className="flex-1 text-[17px] font-extrabold">Pick a date &amp; time</p>
        <span className="text-xs font-extrabold text-brand-text">2 / 3</span>
      </div>
      <div className="mt-3.5 flex gap-1.5">
        <span className="h-1 flex-1 rounded-full bg-brand" />
        <span className="h-1 flex-1 rounded-full bg-brand" />
        <span className="h-1 flex-1 rounded-full bg-border" />
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        {title}
        {packageName ? ` · ${packageName} package` : ""}
      </p>

      <div className="mt-3 rounded-[22px] border-[1.5px] border-border bg-surface p-4.5 shadow-[0_6px_20px_-14px_rgba(131,77,251,.5)]">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMonthOffset((m) => m - 1)}
            className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-surface-muted"
          >
            <Icon name="chevron_left" />
          </button>
          <span className="text-[15px] font-extrabold">{label}</span>
          <button
            type="button"
            onClick={() => setMonthOffset((m) => m + 1)}
            className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-surface-muted"
          >
            <Icon name="chevron_right" />
          </button>
        </div>
        <div className="mt-3.5 grid grid-cols-7 gap-0.5">
          {DOW.map((d, i) => (
            <div key={i} className="py-1 text-center text-[11px] font-extrabold text-muted-foreground/60">
              {d}
            </div>
          ))}
          {days.map((d, i) => {
            const disabled = !d || d < today;
            const selected = d && date && d.getTime() === date.getTime();
            return (
              <div key={i} className="flex items-center justify-center py-0.5">
                {d ? (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setDate(d)}
                    className={cn(
                      "flex h-[38px] w-[38px] items-center justify-center rounded-full text-[13.5px] font-bold",
                      selected
                        ? "bg-brand text-white"
                        : disabled
                          ? "text-muted-foreground/30"
                          : "text-foreground hover:bg-brand-tint",
                    )}
                  >
                    {d.getDate()}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <h2 className="mt-5 text-[15px] font-extrabold">Morning</h2>
      <div className="mt-2 flex flex-wrap gap-2">
        {AM_SLOTS.map((slot) => (
          <button
            key={slot}
            type="button"
            onClick={() => setTime(slot)}
            className={cn(
              "rounded-xl border-[1.5px] px-4 py-2.5 text-[13.5px] font-extrabold transition active:scale-95",
              time === slot
                ? "border-brand bg-brand text-white"
                : "border-border bg-surface text-foreground",
            )}
          >
            {slot}
          </button>
        ))}
      </div>
      <h2 className="mt-4 text-[15px] font-extrabold">Afternoon</h2>
      <div className="mt-2 flex flex-wrap gap-2">
        {PM_SLOTS.map((slot) => (
          <button
            key={slot}
            type="button"
            onClick={() => setTime(slot)}
            className={cn(
              "rounded-xl border-[1.5px] px-4 py-2.5 text-[13.5px] font-extrabold transition active:scale-95",
              time === slot
                ? "border-brand bg-brand text-white"
                : "border-border bg-surface text-foreground",
            )}
          >
            {slot}
          </button>
        ))}
      </div>

      <div className="mt-5">
        <label htmlFor="location" className="text-[13px] font-bold text-foreground">
          Address
        </label>
        <input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Where should the pro come?"
          className="mt-1.5 h-12 w-full rounded-xl border-[1.5px] border-border bg-surface px-4 text-sm font-semibold placeholder:font-normal placeholder:text-muted-foreground focus-visible:border-brand focus-visible:outline-none"
        />
      </div>

      <div className="flex-1" />
      <div className="py-6">
        <button
          type="button"
          disabled={!canContinue}
          onClick={() => setStep("review")}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-[15.5px] font-extrabold text-white shadow-[0_12px_26px_rgba(131,77,251,.35)] transition active:scale-[.97] disabled:opacity-40"
        >
          Continue
          <Icon name="arrow_forward" className="text-xl" />
        </button>
      </div>
    </div>
  );
}
