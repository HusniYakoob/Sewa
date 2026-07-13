import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/icon";
import { formatLKR } from "@/lib/pricing";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(
      "id, status, completed_at, service_amount, buyer_fee, total_charged, service:services(title), seller:seller_profiles(profile:profiles(full_name))",
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const b = data as unknown as {
    id: string;
    status: string;
    completed_at: string | null;
    service_amount: number;
    buyer_fee: number;
    total_charged: number;
    service: { title: string } | null;
    seller: { profile: { full_name: string } | null } | null;
  };

  const { data: payment } = await supabase
    .from("payments")
    .select("payhere_payment_id, payment_method, created_at")
    .eq("booking_id", id)
    .maybeSingle();

  const ref = `SW-${id.slice(0, 5).toUpperCase()}`;
  const txn = payment?.payhere_payment_id ?? "—";

  return (
    <div>
      <div className="flex items-center gap-3.5 px-[22px] pt-3">
        <Link
          href="/bookings?tab=completed"
          aria-label="Back"
          className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-border bg-surface"
        >
          <Icon name="arrow_back" />
        </Link>
        <p className="text-[17px] font-extrabold">Receipt</p>
      </div>

      <div className="px-[22px] pt-4">
        <div className="rounded-[20px] border-[1.5px] border-border bg-surface p-5 shadow-[0_6px_20px_-14px_rgba(131,77,251,.5)]">
          <div className="flex items-center gap-1.5">
            <span className="rounded-full bg-success/15 px-2.5 py-1 text-[10.5px] font-extrabold tracking-wide text-success">
              PAYMENT COMPLETED
            </span>
          </div>
          <p className="mt-3 text-[20px] font-extrabold">{b.service?.title ?? "Service"}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            with {b.seller?.profile?.full_name} · #{ref}
          </p>

          <div className="my-4 h-px bg-border" />

          <p className="mb-2 text-[11px] font-extrabold tracking-wide text-muted-foreground">
            PAYMENT SUMMARY
          </p>
          <div className="flex flex-col gap-1.5">
            <Row label={b.service?.title ?? "Service"} value={formatLKR(b.service_amount)} />
            <Row label="Service fee (5%)" value={formatLKR(b.buyer_fee)} />
            <div className="my-1.5 h-px bg-border" />
            <Row label="Total paid" value={formatLKR(b.total_charged)} strong />
          </div>

          <div className="my-4 h-px bg-border" />
          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Payment method</span>
              <span className="font-bold text-foreground">
                {payment?.payment_method ?? "PayHere"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Transaction ID</span>
              <span className="font-bold text-foreground">{txn}</span>
            </div>
            <div className="flex justify-between">
              <span>Date</span>
              <span className="font-bold text-foreground">
                {b.completed_at
                  ? new Date(b.completed_at).toLocaleDateString("en-LK", {
                      dateStyle: "medium",
                    })
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <ActionButton icon="picture_as_pdf" label="Download PDF" />
          <ActionButton icon="mail" label="Email receipt" />
          <ActionButton icon="share" label="Share" />
        </div>

        <div className="mt-5 flex flex-col gap-2.5 pb-8">
          <Link
            href={`/service/${id}`}
            className="flex items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 text-sm font-extrabold text-white"
          >
            Book again
          </Link>
          <Link
            href={`/help/report?booking=${id}`}
            className="rounded-2xl border-[1.5px] border-danger/30 py-3.5 text-center text-sm font-extrabold text-danger"
          >
            Report an issue with this booking
          </Link>
          <Link
            href="/help"
            className="text-center text-xs font-bold text-muted-foreground"
          >
            Contact support
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={strong ? "text-sm font-extrabold" : "text-xs text-muted-foreground"}>
        {label}
      </span>
      <span
        className={
          strong
            ? "font-mono text-[15px] font-extrabold text-brand-text tabular-nums"
            : "font-mono text-xs font-bold tabular-nums"
        }
      >
        {value}
      </span>
    </div>
  );
}

function ActionButton({ icon, label }: { icon: string; label: string }) {
  return (
    <button
      type="button"
      className="flex flex-col items-center gap-1.5 rounded-2xl border-[1.5px] border-border bg-surface py-3.5"
    >
      <Icon name={icon} className="text-lg text-brand-text" />
      <span className="text-center text-[10px] font-bold leading-tight">{label}</span>
    </button>
  );
}
