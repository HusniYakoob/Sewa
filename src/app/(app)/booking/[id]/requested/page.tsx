import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/icon";
import { formatLKR } from "@/lib/pricing";
import { WithdrawButton } from "./withdraw-button";

export default async function BookingRequestedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/welcome");

  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(
      "id, status, scheduled_at, total_charged, buyer_id, service:services(title), seller:seller_profiles(id, user_id, profile:profiles(full_name))",
    )
    .eq("id", id)
    .maybeSingle();

  if (!data || data.buyer_id !== profile.id) notFound();
  const booking = data as unknown as {
    id: string;
    status: string;
    scheduled_at: string;
    total_charged: number;
    service: { title: string } | null;
    seller: { id: string; user_id: string; profile: { full_name: string } | null } | null;
  };

  if (booking.status !== "pending") redirect(`/booking/${id}`);

  const sellerName = booking.seller?.profile?.full_name ?? "your pro";
  const firstName = sellerName.split(" ")[0];

  return (
    <div className="flex min-h-dvh flex-col px-[22px] pt-3">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <span className="relative flex h-24 w-24 items-center justify-center">
          <span className="absolute inset-0 animate-pulse rounded-full bg-brand-tint" />
          <span className="relative flex h-[74px] w-[74px] items-center justify-center rounded-full bg-brand">
            <Icon name="schedule_send" className="text-4xl text-white" />
          </span>
        </span>
        <h1 className="mt-5.5 text-[22px] font-extrabold tracking-tight">
          Request sent to {firstName}
        </h1>
        <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-muted-foreground">
          They usually respond within 30 minutes. We&rsquo;ll notify you the moment they confirm
          — your card won&rsquo;t be charged until then.
        </p>

        <div className="mt-5.5 flex w-full max-w-[290px] items-center gap-3 rounded-2xl border-[1.5px] border-border bg-surface p-4 text-left">
          <span className="h-11 w-11 flex-none rounded-2xl bg-brand-tint" />
          <div className="flex-1">
            <p className="text-[13.5px] font-extrabold">
              {booking.service?.title ?? "Service"} · {sellerName}
            </p>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              {new Date(booking.scheduled_at).toLocaleDateString("en-LK", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
              ,{" "}
              {new Date(booking.scheduled_at).toLocaleTimeString("en-LK", {
                hour: "numeric",
                minute: "2-digit",
              })}{" "}
              · {formatLKR(booking.total_charged)}
            </p>
          </div>
        </div>

        {booking.seller ? (
          <Link
            href={`/chats/start?seller=${booking.seller.id}`}
            className="mt-4.5 flex items-center gap-1.5 text-brand-text"
          >
            <Icon name="chat_bubble" className="text-lg" />
            <span className="text-[13px] font-extrabold">Message {firstName}</span>
          </Link>
        ) : null}
      </div>

      <div className="pb-[30px]">
        <Link
          href="/bookings"
          className="mb-2.5 block rounded-2xl border-[1.5px] border-border bg-surface py-4 text-center text-[14.5px] font-extrabold"
        >
          View in Bookings
        </Link>
        <WithdrawButton bookingId={booking.id} />
      </div>
    </div>
  );
}
