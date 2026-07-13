import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSellerProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/icon";
import { formatLKR } from "@/lib/pricing";
import { purchasePlan } from "./actions";

const FEATURES: Record<string, string[]> = {
  starter: ["3 active service ads", "Standard search placement", "Email support"],
  pro: ["10 active service ads", "Higher search placement", "Lower commission", "Priority support"],
  business: ["30 active service ads", "Top search placement", "Lowest commission", "Priority support"],
};

export default async function PlansPage() {
  const seller = await getCurrentSellerProfile();
  if (!seller) redirect("/become-seller");

  const supabase = await createClient();
  const { data } = await supabase.from("plans").select("id, key, name, price_lkr, commission_rate").order("sort_order");
  const plans = data ?? [];

  return (
    <div>
      <div className="flex items-center gap-3.5 px-[22px] pt-3">
        <Link
          href="/account"
          aria-label="Back"
          className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-border bg-surface"
        >
          <Icon name="arrow_back" />
        </Link>
      </div>

      <div className="px-[22px] pt-4">
        <h1 className="text-[27px] font-extrabold tracking-tight">Choose your plan</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Free to join. Upgrade or downgrade anytime from your seller account.
        </p>

        <div className="mt-5 flex flex-col gap-3">
          {plans.map((p) => {
            const isCurrent = p.id === seller.plan_id;
            const gatewayShare = 0.025;
            const totalFee = Number(p.commission_rate) + gatewayShare;
            return (
              <form key={p.id} action={purchasePlan} className="relative">
                <input type="hidden" name="plan_id" value={p.id} />
                {p.key === "pro" ? (
                  <span className="absolute -top-2.5 right-4 flex items-center gap-1 rounded-full bg-accent px-2.5 py-1">
                    <Icon name="star" className="text-xs text-[#5B4B00]" />
                    <span className="text-[9.5px] font-extrabold tracking-wide text-[#5B4B00]">
                      MOST POPULAR
                    </span>
                  </span>
                ) : null}
                <button
                  type="submit"
                  disabled={isCurrent}
                  className={`w-full rounded-[20px] border-2 p-4.5 text-left transition ${
                    isCurrent
                      ? "border-brand bg-brand-tint"
                      : "border-border bg-surface"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 ${
                        isCurrent ? "border-brand bg-brand" : "border-border"
                      }`}
                    >
                      {isCurrent ? <Icon name="check" className="text-sm text-white" /> : null}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[17px] font-extrabold capitalize">{p.name}</span>
                        <span className="text-[15px] font-extrabold">
                          {p.price_lkr > 0 ? `${formatLKR(p.price_lkr)}/mo` : "Free"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs font-bold text-brand-text">
                        {(totalFee * 100).toFixed(1)}% commission per booking
                      </p>
                      <div className="mt-3 flex flex-col gap-1.5">
                        {(FEATURES[p.key] ?? []).map((f) => (
                          <div key={f} className="flex items-start gap-2">
                            <Icon name="check_circle" filled className="mt-0.5 text-sm text-success" />
                            <span className="text-xs leading-snug text-muted-foreground">{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              </form>
            );
          })}
        </div>

        <p className="mt-4 px-1 text-[11.5px] leading-relaxed text-muted-foreground">
          You can change or cancel your plan anytime from Account → Manage plan.
        </p>
      </div>
    </div>
  );
}
