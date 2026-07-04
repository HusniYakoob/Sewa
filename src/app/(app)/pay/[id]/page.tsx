import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { Icon } from "@/components/ui/icon";
import { PayForm } from "./pay-form";
import { payhereEnv, formatAmount, generateCheckoutHash } from "@/lib/payhere";
import { formatLKR } from "@/lib/pricing";

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
      "id, status, service_amount, buyer_fee, total_charged, buyer_id, service:services(title)",
    )
    .eq("id", id)
    .maybeSingle();

  const booking = data as {
    id: string;
    status: string;
    service_amount: number;
    buyer_fee: number;
    total_charged: number;
    buyer_id: string;
    service: { title: string } | null;
  } | null;

  if (!booking) notFound();
  if (booking.status !== "pending") redirect(`/booking/${id}`);

  const { merchantId, checkoutUrl, appUrl, configured } = payhereEnv();
  const amount = Number(booking.total_charged);
  const [firstName, ...rest] = (profile?.full_name || "Customer").split(" ");
  const lastName = rest.join(" ") || firstName;

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
    <div className="flex min-h-dvh flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-[22px] pt-3">
        <Link
          href={`/service/${booking.id}`}
          aria-label="Back"
          className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-border bg-surface"
        >
          <Icon name="arrow_back" />
        </Link>
        <span className="flex-1 text-[17px] font-extrabold">Review &amp; pay</span>
        <span className="text-xs font-extrabold text-brand-text">3 / 3</span>
      </div>

      <div className="flex-1 px-[22px] pt-4">
        {/* Provider summary */}
        <div className="rounded-[18px] bg-surface p-4 shadow-[0_6px_20px_-12px_rgba(131,77,251,.4)]">
          <div className="flex items-center gap-3">
            <span className="h-[46px] w-[46px] flex-none rounded-[14px] bg-brand-tint" />
            <div>
              <p className="text-[14.5px] font-extrabold">
                {booking.service?.title ?? "Service"}
              </p>
              <p className="text-xs text-muted-foreground">Held in escrow until done</p>
            </div>
          </div>
        </div>

        {/* Fee breakdown */}
        <div className="mt-3 rounded-[18px] bg-surface p-4 shadow-[0_6px_20px_-12px_rgba(131,77,251,.4)]">
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
              Held in <b>escrow</b> — released after your END PIN confirms the job.
            </span>
          </div>
        </div>

        {/* Pay with */}
        <h2 className="mt-5 text-[15px] font-extrabold">Pay with</h2>
        <div className="mt-2.5 flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-[0_6px_20px_-12px_rgba(131,77,251,.4)]">
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

      {/* Pay CTA */}
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
        Free cancellation until 24h before · 25% within 24h · full fee after arrival
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
