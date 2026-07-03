import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/nav/app-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { RevealPin } from "./reveal-pin";
import { SellerJob } from "./seller-job";
import { formatLKR } from "@/lib/pricing";
import type { BookingStatus } from "@/lib/supabase/types";

const STATUS: Record<
  BookingStatus,
  { variant: "neutral" | "success" | "warning" | "danger" | "info"; label: string }
> = {
  pending: { variant: "warning", label: "Awaiting payment" },
  accepted: { variant: "success", label: "Confirmed" },
  declined: { variant: "danger", label: "Declined" },
  arrived: { variant: "info", label: "Provider arrived" },
  in_progress: { variant: "info", label: "In progress" },
  completed: { variant: "success", label: "Completed" },
  cancelled: { variant: "neutral", label: "Cancelled" },
  disputed: { variant: "danger", label: "Disputed" },
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
      "id, status, total_charged, seller_net, scheduled_at, location, notes, buyer_id, service:services(title)",
    )
    .eq("id", id)
    .maybeSingle();

  const booking = data as {
    id: string;
    status: BookingStatus;
    total_charged: number;
    seller_net: number;
    scheduled_at: string;
    location: string | null;
    notes: string | null;
    buyer_id: string;
    service: { title: string } | null;
  } | null;

  if (!booking) notFound();

  // Seller view: job progression + PIN entry.
  if (booking.buyer_id !== user?.id) {
    return (
      <div>
        <AppHeader title="Job" backHref="/bookings" />
        <SellerJob
          bookingId={booking.id}
          status={booking.status}
          title={booking.service?.title ?? "Service"}
          scheduledAt={booking.scheduled_at}
          location={booking.location}
          notes={booking.notes}
          sellerNet={Number(booking.seller_net)}
        />
      </div>
    );
  }

  // Buyer view: confirmation + revealable PINs.
  const { data: pinRow } = await supabase
    .from("booking_pins")
    .select("start_pin, end_pin")
    .eq("booking_id", id)
    .maybeSingle();
  const pins = pinRow as { start_pin: string; end_pin: string } | null;

  const st = STATUS[booking.status];
  const isPaid = booking.status !== "pending" && booking.status !== "cancelled";

  return (
    <div>
      <AppHeader title="Booking" backHref="/bookings" />
      <div className="flex flex-col gap-4 p-4">
        {paid ? (
          <Card className="flex items-center gap-2 border-success/40">
            <Icon name="check_circle" filled className="text-success" />
            <p className="text-sm font-medium">Payment received. Booking confirmed.</p>
          </Card>
        ) : null}
        {cancelled ? (
          <Card className="flex items-center gap-2 border-warning/40">
            <Icon name="info" className="text-warning" />
            <p className="text-sm font-medium">Payment was cancelled. You can try again.</p>
          </Card>
        ) : null}

        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{booking.service?.title ?? "Service"}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {new Date(booking.scheduled_at).toLocaleString("en-LK", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
                {booking.location ? ` · ${booking.location}` : ""}
              </p>
            </div>
            <Badge variant={st.variant}>{st.label}</Badge>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <span className="text-sm text-muted-foreground">Paid</span>
            <span className="font-mono font-semibold tabular-nums">
              {formatLKR(booking.total_charged)}
            </span>
          </div>
        </Card>

        {isPaid && pins ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold">Your service PINs</p>
            <p className="text-sm text-muted-foreground">
              Read the START PIN to your provider when they arrive. Read the END
              PIN only when the job is done. Payment releases after the END PIN.
            </p>
            <div className="mt-1 flex flex-col gap-2">
              <RevealPin label="START PIN" pin={pins.start_pin} />
              <RevealPin label="END PIN" pin={pins.end_pin} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
