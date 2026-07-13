import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { formatLKR } from "@/lib/pricing";
import type { BookingStatus } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type BookingRow = {
  id: string;
  status: BookingStatus;
  scheduled_at: string;
  total_charged: number;
  service: { title: string } | null;
  seller: { profile: { full_name: string } | null } | null;
  buyer: { full_name: string } | null;
};

const UPCOMING_STATUSES: BookingStatus[] = ["pending", "accepted", "arrived", "in_progress"];

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const isCompleted = tab === "completed";
  const profile = await getCurrentProfile();
  const isSeller = profile?.active_context === "seller";

  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(
      "id, status, scheduled_at, total_charged, service:services(title), seller:seller_profiles(profile:profiles(full_name)), buyer:profiles(full_name)",
    )
    .order("scheduled_at", { ascending: false });

  const all = (data ?? []) as unknown as BookingRow[];
  const bookings = all.filter((b) =>
    isCompleted
      ? b.status === "completed"
      : UPCOMING_STATUSES.includes(b.status),
  );

  const completedTotal = all
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + Number(b.total_charged), 0);

  return (
    <div>
      <h1 className="px-[22px] pt-3 text-[28px] font-extrabold tracking-tight">
        {isSeller ? "Jobs" : "Bookings"}
      </h1>

      <div className="mx-[22px] mt-4.5 flex rounded-2xl bg-surface-muted p-1">
        <Link
          href="/bookings"
          className={cn(
            "flex-1 rounded-xl py-2.5 text-center text-[13.5px] font-extrabold transition",
            !isCompleted ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground",
          )}
        >
          Upcoming
        </Link>
        <Link
          href="/bookings?tab=completed"
          className={cn(
            "flex-1 rounded-xl py-2.5 text-center text-[13.5px] font-extrabold transition",
            isCompleted ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground",
          )}
        >
          Completed
        </Link>
      </div>

      {isCompleted && bookings.length > 0 ? (
        <div className="mx-[22px] mt-3 flex items-center justify-between rounded-2xl bg-brand-tint px-4 py-3">
          <span className="text-xs font-bold text-brand-text">Total spent</span>
          <span className="text-[15px] font-extrabold text-brand-text">
            {formatLKR(completedTotal)}
          </span>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 px-[22px] pb-24 pt-4">
        {bookings.length === 0 ? (
          <EmptyState
            icon={isCompleted ? "task_alt" : "event_busy"}
            title={isCompleted ? "Nothing completed yet" : "No bookings yet"}
            description={
              isCompleted
                ? "Finished jobs will show up here."
                : "Your upcoming bookings will appear here."
            }
            action={
              !isCompleted ? (
                <Link href="/categories" className={buttonVariants({ size: "sm" })}>
                  Browse services
                </Link>
              ) : undefined
            }
          />
        ) : (
          bookings.map((b) => (
            <Link
              key={b.id}
              href={isCompleted ? `/bookings/${b.id}/receipt` : `/booking/${b.id}`}
              className={cn(
                "rounded-[20px] p-4.5 shadow-[0_6px_20px_-14px_rgba(131,77,251,.5)]",
                b.status === "in_progress"
                  ? "bg-[#1B1C2B] text-white"
                  : "border-[1.5px] border-border bg-surface",
              )}
            >
              <div className="flex items-center gap-2">
                <StatusChip status={b.status} inverted={b.status === "in_progress"} />
                <div className="flex-1" />
                <span
                  className={cn(
                    "text-[11px]",
                    b.status === "in_progress" ? "text-white/50" : "text-muted-foreground",
                  )}
                >
                  #SW-{b.id.slice(0, 5).toUpperCase()}
                </span>
              </div>
              <div className="mt-3.5 flex items-center gap-3">
                <span
                  className={cn(
                    "h-[46px] w-[46px] flex-none rounded-2xl",
                    b.status === "in_progress" ? "bg-white/20" : "bg-brand-tint",
                  )}
                />
                <div className="flex-1">
                  <p className="text-[15px] font-extrabold">{b.service?.title ?? "Service"}</p>
                  <p
                    className={cn(
                      "mt-0.5 text-xs",
                      b.status === "in_progress" ? "text-white/60" : "text-muted-foreground",
                    )}
                  >
                    {isSeller ? b.buyer?.full_name : b.seller?.profile?.full_name} ·{" "}
                    {new Date(b.scheduled_at).toLocaleString("en-LK", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <Icon
                  name="chevron_right"
                  className={b.status === "in_progress" ? "text-white/40" : "text-muted-foreground"}
                />
              </div>
              {!isCompleted && !isSeller && b.status === "accepted" ? (
                <div className="mt-3.5 flex gap-2">
                  <Link
                    href={`/bookings/${b.id}/reschedule`}
                    className="flex-1 rounded-xl border-[1.5px] border-border py-2.5 text-center text-xs font-extrabold"
                  >
                    Reschedule
                  </Link>
                  <span className="flex-1 rounded-xl border-[1.5px] border-danger/30 py-2.5 text-center text-xs font-extrabold text-danger">
                    Cancel
                  </span>
                </div>
              ) : null}
              {isCompleted ? (
                <p
                  className={cn(
                    "mt-3 font-mono text-sm font-extrabold tabular-nums",
                    b.status === "in_progress" ? "text-white" : "text-foreground",
                  )}
                >
                  {formatLKR(b.total_charged)}
                </p>
              ) : null}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function StatusChip({ status, inverted }: { status: BookingStatus; inverted: boolean }) {
  const map: Partial<Record<BookingStatus, { label: string; icon: string }>> = {
    pending: { label: "AWAITING PAYMENT", icon: "schedule" },
    accepted: { label: "IN ESCROW", icon: "lock" },
    arrived: { label: "PROVIDER ARRIVED", icon: "location_on" },
    in_progress: { label: "IN PROGRESS", icon: "bolt" },
  };
  const info = map[status] ?? { label: status.toUpperCase(), icon: "info" };
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 rounded-full px-2.5 py-1",
        inverted ? "bg-white/20" : "bg-brand-tint",
      )}
    >
      {status === "in_progress" ? (
        <span className="h-1.5 w-1.5 rounded-full bg-[#3ddc84]" />
      ) : (
        <Icon
          name={info.icon}
          filled
          className={cn("text-xs", inverted ? "text-white" : "text-brand-text")}
        />
      )}
      <span className={cn("text-[11px] font-extrabold", inverted ? "text-white" : "text-brand-text")}>
        {info.label}
      </span>
    </span>
  );
}
