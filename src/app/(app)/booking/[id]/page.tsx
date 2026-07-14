import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/nav/app-header";
import { Icon } from "@/components/ui/icon";
import { getCurrentSellerProfile } from "@/lib/auth";
import { RevealPin } from "./reveal-pin";
import { SellerJob } from "./seller-job";
import { BookingRequestReview } from "./booking-request-review";
import { ReviewForm } from "./review-form";
import { CancelForm } from "./cancel-form";
import { RefundForm } from "./refund-form";
import { buttonVariants } from "@/components/ui/button";
import { formatLKR, cancellationFee } from "@/lib/pricing";
import type { BookingStatus } from "@/lib/supabase/types";

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "AWAITING SELLER",
  accepted: "CONFIRMED",
  declined: "DECLINED",
  arrived: "PROVIDER ARRIVED",
  in_progress: "IN PROGRESS",
  completed: "COMPLETED",
  cancelled: "CANCELLED",
  disputed: "DISPUTED",
};

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string; cancelled?: string }>;
}) {
  const { id } = await params;
  const { paid, cancelled } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("bookings")
    .select(
      "id, status, total_charged, seller_net, seller_commission, scheduled_at, duration_hours, location, notes, buyer_id, seller_id, service_id, seller_approved_at, started_at, arrived_at, package:service_packages(name), service:services(title), buyer:profiles(full_name, phone, created_at)",
    )
    .eq("id", id)
    .maybeSingle();

  const booking = data as unknown as {
    id: string;
    status: BookingStatus;
    total_charged: number;
    seller_net: number;
    seller_commission: number;
    scheduled_at: string;
    duration_hours: number;
    location: string | null;
    notes: string | null;
    buyer_id: string;
    seller_id: string;
    service_id: string;
    seller_approved_at: string | null;
    started_at: string | null;
    arrived_at: string | null;
    package: { name: string } | null;
    service: { title: string } | null;
    buyer: { full_name: string; phone: string | null; created_at: string } | null;
  } | null;

  if (!booking) notFound();

  // Seller view: job progression + PIN entry.
  if (booking.buyer_id !== user?.id) {
    const seller = await getCurrentSellerProfile();
    let planLabel = "Starter plan · 12.5%";
    if (seller?.plan_id) {
      const { data: plan } = await supabase
        .from("plans")
        .select("name, commission_rate")
        .eq("id", seller.plan_id)
        .maybeSingle();
      if (plan) {
        planLabel = `${plan.name} plan · ${(Number(plan.commission_rate) * 100 + 2.5).toFixed(1)}%`;
      }
    }

    if (booking.status === "pending" && !booking.seller_approved_at) {
      return (
        <BookingRequestReview
          bookingId={booking.id}
          buyerName={booking.buyer?.full_name ?? "New customer"}
          buyerSince={booking.buyer?.created_at ?? null}
          serviceTitle={booking.service?.title ?? "Service"}
          packageName={booking.package?.name ?? null}
          scheduledAt={booking.scheduled_at}
          durationHours={booking.duration_hours}
          location={booking.location}
          totalCharged={Number(booking.total_charged)}
          sellerCommission={Number(booking.seller_commission)}
          sellerNet={Number(booking.seller_net)}
          planLabel={planLabel}
        />
      );
    }

    return (
      <SellerJob
        bookingId={booking.id}
        status={booking.status}
        sellerApprovedAt={booking.seller_approved_at}
        title={booking.service?.title ?? "Service"}
        scheduledAt={booking.scheduled_at}
        startedAt={booking.started_at}
        location={booking.location}
        notes={booking.notes}
        sellerNet={Number(booking.seller_net)}
        buyerName={booking.buyer?.full_name ?? "Customer"}
        buyerPhone={booking.buyer?.phone ?? null}
      />
    );
  }

  // Buyer view: an unapproved request still belongs on the "waiting" screen.
  if (booking.status === "pending" && !booking.seller_approved_at) {
    redirect(`/booking/${id}/requested`);
  }

  // Buyer view.
  const { data: pinRow } = await supabase
    .from("booking_pins")
    .select("start_pin, end_pin")
    .eq("booking_id", id)
    .maybeSingle();
  const pins = pinRow as { start_pin: string; end_pin: string } | null;

  const { data: reviewRow } = await supabase
    .from("reviews")
    .select("rating, comment")
    .eq("booking_id", id)
    .maybeSingle();
  const review = reviewRow as { rating: number; comment: string | null } | null;

  const { data: refundRow } = await supabase
    .from("refunds")
    .select("status, amount")
    .eq("booking_id", id)
    .maybeSingle();
  const refund = refundRow as { status: string; amount: number } | null;

  const isPaid = booking.status !== "pending" && booking.status !== "cancelled";
  const cancellable = ["pending", "accepted", "arrived"].includes(booking.status);
  const buyerFee =
    booking.status === "pending"
      ? 0
      : cancellationFee(booking.total_charged, new Date(booking.scheduled_at).getTime(), {
          arrived: booking.status === "arrived",
          bySeller: false,
        });
  const cancelNote =
    booking.status === "pending"
      ? "This booking is not paid yet, so cancelling is free."
      : buyerFee > 0
        ? `A cancellation fee of ${formatLKR(buyerFee)} applies. You will be refunded ${formatLKR(booking.total_charged - buyerFee)}.`
        : "You will be fully refunded.";

  const sched = new Date(booking.scheduled_at);
  const dateStr = sched.toLocaleDateString("en-LK", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timeStr = sched.toLocaleTimeString("en-LK", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const ref = `SW-${id.slice(0, 5).toUpperCase()}`;

  return (
    <div className="pb-24">
      <AppHeader title="Booking" backHref="/bookings" />

      <div className="flex flex-col items-center px-6 pt-4">
        <span className="flex h-[70px] w-[70px] items-center justify-center rounded-full bg-brand">
          <Icon name={isPaid ? "check" : "schedule"} className="text-[32px] text-white" />
        </span>
        <h1 className="mt-4 text-[25px] font-extrabold tracking-tight">
          {paid || isPaid ? "Booking confirmed" : "Almost there"}
        </h1>
        <p className="mt-1.5 text-center text-[13.5px] text-muted-foreground">
          {isPaid ? "Paid & held safely in escrow" : "Complete payment to confirm"}
        </p>
      </div>

      {isPaid && booking.status !== "completed" ? (
        <div className="mx-[22px] mt-5 flex items-center justify-between rounded-2xl border-[1.5px] border-border bg-surface p-4">
          {(["Confirmed", "Scheduled today", "Complete"] as const).map((step, i) => {
            const stepIndex = ["accepted", "arrived", "in_progress"].includes(booking.status)
              ? booking.status === "accepted"
                ? 0
                : 1
              : 2;
            const done = i <= stepIndex;
            return (
              <div key={step} className="flex flex-1 flex-col items-center gap-1.5">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold ${
                    done ? "bg-brand text-white" : "bg-surface-muted text-muted-foreground"
                  }`}
                >
                  {done ? <Icon name="check" className="text-base" /> : i + 1}
                </span>
                <span className="text-center text-[10.5px] font-bold text-muted-foreground">
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}

      {cancelled ? (
        <div className="mx-[22px] mt-4 flex items-center gap-2 rounded-2xl border border-warning/40 bg-surface p-3.5">
          <Icon name="info" className="text-warning" />
          <p className="text-sm font-semibold">Payment was cancelled. You can try again.</p>
        </div>
      ) : null}

      {/* Ticket */}
      <div className="mx-[22px] mt-5">
        <div className="overflow-hidden rounded-t-[24px] bg-[linear-gradient(135deg,#834dfb,#6b2fe0)] dark:bg-[linear-gradient(135deg,#834dfb,#5b27c9)] relative p-5 text-white">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[10.5px] font-extrabold tracking-widest text-[#D9C9FF]">
                SEWA BOOKING
              </p>
              <p className="mt-1 text-[17px] font-extrabold">#{ref}</p>
            </div>
            <span className="rounded-full bg-accent px-2.5 py-1 text-[10.5px] font-extrabold tracking-wide text-accent-foreground">
              {STATUS_LABEL[booking.status]}
            </span>
          </div>
          <div className="relative mt-4 flex items-center gap-3">
            <span className="h-[50px] w-[50px] flex-none rounded-[15px] bg-white/25" />
            <div>
              <p className="text-[17px] font-extrabold tracking-tight">
                {booking.service?.title ?? "Service"}
              </p>
              <p className="mt-0.5 text-xs text-[#D9C9FF]">NIC-verified provider</p>
            </div>
          </div>
        </div>

        <div className="bg-surface px-5 pb-2 pt-4">
          <div className="flex gap-2.5">
            <TicketField label="DATE" value={dateStr} />
            <TicketField label="TIME" value={timeStr} />
            <TicketField label="PAID" value={formatLKR(booking.total_charged)} />
          </div>
          {booking.location ? (
            <div className="mt-3.5 flex items-center gap-2">
              <Icon name="location_on" filled className="text-[17px] text-brand-text" />
              <span className="text-[12.5px] font-semibold text-muted-foreground">
                {booking.location}
              </span>
            </div>
          ) : null}
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-brand-tint px-3.5 py-3">
            <Icon name="lock" filled className="text-[17px] text-brand-text" />
            <span className="text-xs leading-snug">
              Funds release to the provider only after your <b>END PIN</b>.
            </span>
          </div>
        </div>

        {/* Perforation */}
        <div className="relative h-7 bg-surface">
          <div className="absolute inset-x-4 top-1/2 border-t-2 border-dashed border-border" />
          <div className="absolute -left-[14px] top-0 h-7 w-7 rounded-full bg-background" />
          <div className="absolute -right-[14px] top-0 h-7 w-7 rounded-full bg-background" />
        </div>

        {/* PIN */}
        <div className="rounded-b-[24px] bg-surface px-5 pb-5 pt-1.5 shadow-[0_24px_40px_-24px_rgba(131,77,251,.5)]">
          {isPaid && pins ? (
            <>
              <div className="flex items-center gap-1.5">
                <Icon name="pin" filled className="text-[15px] text-brand-text" />
                <span className="text-[10.5px] font-extrabold tracking-wider text-brand-text">
                  START PIN — SHARE ON ARRIVAL
                </span>
              </div>
              <div className="mt-3 flex gap-2.5">
                {pins.start_pin.slice(0, 6).split("").map((d, i) => (
                  <span
                    key={i}
                    className="flex h-[52px] flex-1 items-center justify-center rounded-[14px] bg-muted text-2xl font-extrabold"
                  >
                    {d}
                  </span>
                ))}
              </div>
              <div className="mt-4">
                <RevealPin label="END PIN — after the job" pin={pins.end_pin} />
              </div>
            </>
          ) : (
            <p className="py-2 text-center text-[13px] text-muted-foreground">
              Your PINs appear here once payment is confirmed.
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-col gap-2.5 px-[22px]">
        {booking.status === "pending" ? (
          <Link href={`/pay/${booking.id}`} className={buttonVariants({ block: true })}>
            <Icon name="lock" /> Pay now
          </Link>
        ) : null}

        {cancellable ? <CancelForm bookingId={booking.id} note={cancelNote} /> : null}

        {booking.status === "completed" ? (
          refund ? (
            <div className="flex items-center gap-2 rounded-2xl bg-surface p-4 shadow-[0_6px_20px_-12px_rgba(131,77,251,.3)]">
              <Icon name="receipt_long" className="text-muted-foreground" />
              <p className="text-sm">
                Refund {refund.status} · {formatLKR(refund.amount)}
              </p>
            </div>
          ) : (
            <RefundForm bookingId={booking.id} />
          )
        ) : null}

        {booking.status === "completed" ? (
          review ? (
            <div className="rounded-2xl bg-surface p-4 shadow-[0_6px_20px_-12px_rgba(131,77,251,.3)]">
              <p className="text-sm font-extrabold">Your review</p>
              <div className="mt-1 flex gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Icon
                    key={n}
                    name="star"
                    filled={n <= review.rating}
                    className={n <= review.rating ? "text-[#EAB308]" : "text-muted-foreground"}
                  />
                ))}
              </div>
              {review.comment ? (
                <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
              ) : null}
            </div>
          ) : (
            <ReviewForm
              bookingId={booking.id}
              sellerId={booking.seller_id}
              serviceId={booking.service_id}
            />
          )
        ) : null}
      </div>
    </div>
  );
}

function TicketField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1">
      <p className="text-[10.5px] font-extrabold tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-extrabold tabular-nums">{value}</p>
    </div>
  );
}
