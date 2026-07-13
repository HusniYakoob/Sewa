import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { Icon } from "@/components/ui/icon";
import { PayForm } from "@/app/(app)/pay/[id]/pay-form";
import { payhereEnv, formatAmount, generateCheckoutHash } from "@/lib/payhere";
import { formatLKR } from "@/lib/pricing";

export default async function PlanCheckoutPage({
  params,
}: {
  params: Promise<{ purchaseId: string }>;
}) {
  const { purchaseId } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data } = await supabase
    .from("plan_purchases")
    .select("id, amount, status, plan:plans(name)")
    .eq("id", purchaseId)
    .maybeSingle();

  if (!data) notFound();
  const purchase = data as unknown as {
    id: string;
    amount: number;
    status: string;
    plan: { name: string } | null;
  };
  if (purchase.status !== "pending") redirect("/account");

  const { merchantId, checkoutUrl, appUrl, configured } = payhereEnv();
  const amount = Number(purchase.amount);
  const orderId = `plan_${purchase.id}`;
  const [firstName, ...rest] = (profile?.full_name || "Seller").split(" ");
  const lastName = rest.join(" ") || firstName;

  const fields: Record<string, string> = {
    merchant_id: merchantId,
    return_url: `${appUrl}/account?plan_paid=1`,
    cancel_url: `${appUrl}/plans?cancelled=1`,
    notify_url: `${appUrl}/api/payments/payhere/webhook`,
    order_id: orderId,
    items: `Sewa ${purchase.plan?.name ?? "Plan"} subscription`,
    currency: "LKR",
    amount: formatAmount(amount),
    first_name: firstName,
    last_name: lastName,
    email: profile?.email ?? "",
    phone: profile?.phone ?? "",
    address: "",
    city: "Colombo",
    country: "Sri Lanka",
    hash: generateCheckoutHash(orderId, amount),
  };

  return (
    <div className="flex min-h-dvh flex-col px-[22px] pb-24 pt-3">
      <p className="text-[17px] font-extrabold">Upgrade to {purchase.plan?.name}</p>
      <div className="mt-5 rounded-2xl border-[1.5px] border-border bg-surface p-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{purchase.plan?.name} plan · monthly</span>
          <span className="font-extrabold">{formatLKR(amount)}</span>
        </div>
      </div>
      <div className="flex-1" />
      <div className="pb-8">
        {configured ? (
          <PayForm checkoutUrl={checkoutUrl} fields={fields} label={`Pay ${formatLKR(amount)}`} />
        ) : (
          <div className="rounded-2xl border border-warning/40 bg-surface p-4">
            <p className="flex items-center gap-2 text-sm font-bold">
              <Icon name="info" className="text-warning" /> Payments not configured
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
