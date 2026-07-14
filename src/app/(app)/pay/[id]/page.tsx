import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { Icon } from "@/components/ui/icon";
import { PayForm } from "./pay-form";
import { payhereEnv, formatAmount, generateCheckoutHash } from "@/lib/payhere";
import { formatLKR } from "@/lib/pricing";

const INCLUDED = [
  "Vetted, NIC-verified providers",
  "Payment held safely until you confirm",
  "Covered by the Sewa Guarantee",
];

export default async function PayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data } = await supabase
    .from("bookings")
    .select(
      "id, status, scheduled_at, location, service_amount, buyer_fee, total_charged, buyer_id, seller_approved_at, service:services(title), seller:seller_profiles(rating, total_reviews, total_bookings, profile:profiles(full_name))",
    )
    .eq("id", id)
    .maybeSingle();

  const booking = data as unknown as {
    id: string;
    status: string;
    scheduled_at: string;
    location: string | null;
    service_amount: number;
    buyer_fee: number;
    total_charged: number;
    buyer_id: string;
    seller_approved_at: string | null;
    service: { title: string } | null;
    seller: {
      rating: number;
      total_reviews: number;
      total_bookings: number;
      profile: { full_name: string } | null;
    } | null;
  } | null;

  if (!booking) notFound();
  if (booking.status !== "pending") redirect(`/booking/${id}`);
  // Not yet approved by the seller — nothing to pay for yet.
  if (!booking.seller_approved_at) redirect(`/booking/${id}/requested`);

  const { merchantId, checkoutUrl, appUrl, configured } = payhereEnv();
  const amount = Number(booking.total_charged);
  const [firstName, ...rest] = (profile?.full_name || "Customer").split(" ");
  const lastName = rest.join(" ") || firstName;
  const scheduled = new Date(booking.scheduled_at);

  const fields: Record<string, string> = {
    merchant_id: merchantId,
    return_url: `${appUrl}/booking/${id}?paid=1`,
    cancel_url: `${appUrl}/booking/${id}?cancelled=1`,
    notify_url: `${appUrl}/api/payments/payhere/webhook`,
    order_id: id,
    items: booking.service?.title ?? "Sewa service",
    currency: "LKR",
    amount: formatAmount(amount),
    first_name: firstName,
    last_name: lastName,
    email: profile?.email ?? "",
    phone: profile?.phone ?? "",
    address: "",
    city: "Colombo",
    country: "Sri Lanka",
    hash: generateCheckoutHash(id, amount),
  };

  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <div className="flex items-center gap-3 px-[22px] pt-3">
        <Link
          href="/bookings"
          aria-label="Back"
          className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-border bg-surface"
        >
          <Icon name="arrow_back" />
        </Link>
        <span className="flex-1 text-[17px] font-extrabold">Review &amp; pay</span>
        <span className="text-xs font-extrabold text-brand-text">3 / 3</span>
      </div>

      <div className="flex-1 overflow-y-auto px-[22px] pt-4">
        <div className="rounded-[18px] border-[1.5px] border-border bg-surface p-4 shadow-[0_6px_20px_-12px_rgba(131,77,251,.4)]">
          <div className="flex items-center gap-3">
            <span className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#834dfb,#6b2fe0)] text-[15px] font-extrabold text-white">
              {(booking.seller?.profile?.full_name ?? "S")
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[14.5px] font-extrabold">
                  {booking.seller?.profile?.full_name}
                </span>
                <Icon name="verified" filled className="text-sm text-brand-text" />
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {booking.service?.title} · {(booking.seller?.rating ?? 0).toFixed(1)}{" "}
                <Icon name="star" filled className="align-middle text-sm text-[#EAB308]" /> (
                {booking.seller?.total_reviews ?? 0} jobs)
              </p>
            </div>
          </div>
          <div className="my-3 h-px bg-border" />
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <Icon name="calendar_month" className="text-base text-muted-foreground" />
              <span className="text-[12.5px]">
                {scheduled.toLocaleDateString("en-LK", {
                  weekday: "long",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}{" "}
                ·{" "}
                {scheduled.toLocaleTimeString("en-LK", { hour: "numeric", minute: "2-digit" })}
              </span>
            </div>
            {booking.location ? (
              <div className="flex items-center gap-2.5">
                <Icon name="location_on" className="text-base text-muted-foreground" />
                <span className="text-[12.5px]">{booking.location}</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-3 rounded-[18px] border-[1.5px] border-border bg-surface p-4 shadow-[0_6px_20px_-12px_rgba(131,77,251,.4)]">
          <p className="mb-2.5 text-[11px] font-extrabold tracking-wide text-muted-foreground">
            WHAT&rsquo;S INCLUDED
          </p>
          <div className="flex flex-col gap-2">
            {INCLUDED.map((item) => (
              <div key={item} className="flex items-start gap-2">
                <Icon name="check_circle" filled className="mt-0.5 text-base text-success" />
                <span className="text-xs leading-snug text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 rounded-[18px] border-[1.5px] border-border bg-surface p-4 shadow-[0_6px_20px_-12px_rgba(131,77,251,.4)]">
          <Row label="Job amount" value={formatLKR(booking.service_amount)} />
          <Row label="Service fee (5%)" value={formatLKR(booking.buyer_fee)} />
          <div className="my-2.5 h-px bg-border" />
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-extrabold">Total</span>
            <span className="text-lg font-extrabold text-brand-text">
              {formatLKR(amount)}
            </span>
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-brand-tint px-3.5 py-3">
            <Icon name="lock" filled className="text-base text-brand-text" />
            <span className="text-xs leading-relaxed">
              Payment protected — held safely, released after your END PIN confirms the job.
            </span>
          </div>
        </div>

        <div className="mt-3 rounded-[18px] border-[1.5px] border-border bg-surface p-4 shadow-[0_6px_20px_-12px_rgba(131,77,251,.4)]">
          <div className="flex items-center gap-2">
            <Icon name="event_busy" className="text-[17px] text-muted-foreground" />
            <span className="text-[13px] font-extrabold">Cancellation policy</span>
          </div>
          <div className="mt-2.5 flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">More than 24 hours before</span>
              <span className="font-extrabold text-success">Free</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Within 24 hours</span>
              <span className="font-extrabold text-warning">25% fee</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">After the pro arrives</span>
              <span className="font-extrabold text-danger">50% fee</span>
            </div>
          </div>
        </div>

        <h2 className="mt-5 text-[15px] font-extrabold">Pay with</h2>
        <div className="mt-2.5 flex items-center gap-3 rounded-2xl border-[1.5px] border-border bg-surface p-4 shadow-[0_6px_20px_-12px_rgba(131,77,251,.4)]">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-tint">
            <Icon name="account_balance_wallet" className="text-brand-text" />
          </span>
          <div className="flex-1">
            <p className="text-[13.5px] font-bold">PayHere</p>
            <p className="text-[11px] text-muted-foreground">
              Card, mobile banking or wallet
            </p>
          </div>
          <Icon name="check_circle" filled className="text-brand-text" />
        </div>
      </div>

      <div className="px-[22px] pt-3.5">
        {configured ? (
          <PayForm checkoutUrl={checkoutUrl} fields={fields} label={`Pay ${formatLKR(amount)}`} />
        ) : (
          <div className="rounded-2xl border border-warning/40 bg-surface p-4">
            <p className="flex items-center gap-2 text-sm font-bold">
              <Icon name="info" className="text-warning" /> Payments not configured
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add your PayHere sandbox keys to enable checkout. Your booking is
              saved as pending.
            </p>
          </div>
        )}
      </div>
      <p className="px-8 pb-8 pt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
        Free cancellation until 24h before · 25% within 24h · 50% after arrival
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-[13.5px] text-muted-foreground">{label}</span>
      <span className="text-[13.5px] font-bold tabular-nums">{value}</span>
    </div>
  );
}
