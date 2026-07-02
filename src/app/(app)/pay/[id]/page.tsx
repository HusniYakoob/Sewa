import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { AppHeader } from "@/components/nav/app-header";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { PayForm } from "./pay-form";
import {
  payhereEnv,
  formatAmount,
  generateCheckoutHash,
} from "@/lib/payhere";
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
    .select("id, status, total_charged, buyer_id, service:services(title)")
    .eq("id", id)
    .maybeSingle();

  const booking = data as {
    id: string;
    status: string;
    total_charged: number;
    buyer_id: string;
    service: { title: string } | null;
  } | null;

  if (!booking) notFound();
  // Already paid or moved on: go to the confirmation.
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
    <div>
      <AppHeader title="Payment" backHref={`/service/${booking.id}`} />
      <div className="flex flex-col gap-4 p-4">
        <Card>
          <p className="font-semibold">{booking.service?.title ?? "Service"}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total to pay</span>
            <span className="font-mono text-lg font-semibold tabular-nums">
              {formatLKR(amount)}
            </span>
          </div>
        </Card>

        {configured ? (
          <>
            <PayForm checkoutUrl={checkoutUrl} fields={fields} />
            <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Icon name="verified_user" className="text-base" />
              Secured by PayHere. Your card details never touch Sewa.
            </p>
          </>
        ) : (
          <Card className="border-warning/40">
            <p className="flex items-center gap-2 font-medium text-foreground">
              <Icon name="info" className="text-warning" />
              Payments not configured yet
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Add your PayHere sandbox merchant ID and secret to the
              environment, then this button will open the PayHere checkout. Your
              booking is saved as pending until then.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
