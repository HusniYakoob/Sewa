import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/nav/app-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatLKR } from "@/lib/pricing";
import type { BookingStatus } from "@/lib/supabase/types";

type BookingRow = {
  id: string;
  status: BookingStatus;
  scheduled_at: string;
  total_charged: number;
  service: { title: string } | null;
};

const STATUS_BADGE: Record<
  BookingStatus,
  { variant: "neutral" | "success" | "warning" | "danger" | "info"; label: string }
> = {
  pending: { variant: "warning", label: "Pending" },
  accepted: { variant: "info", label: "Confirmed" },
  declined: { variant: "danger", label: "Declined" },
  arrived: { variant: "info", label: "Arrived" },
  in_progress: { variant: "info", label: "In progress" },
  completed: { variant: "success", label: "Completed" },
  cancelled: { variant: "neutral", label: "Cancelled" },
  disputed: { variant: "danger", label: "Disputed" },
};

export default async function BookingsPage() {
  const supabase = await createClient();
  // RLS returns only the current user's bookings (as buyer or seller).
  const { data } = await supabase
    .from("bookings")
    .select("id, status, scheduled_at, total_charged, service:services(title)")
    .order("scheduled_at", { ascending: false });

  const bookings = (data ?? []) as unknown as BookingRow[];

  return (
    <div>
      <AppHeader title="Bookings" />
      <div className="p-4">
        {bookings.length === 0 ? (
          <EmptyState
            icon="event_busy"
            title="No bookings yet"
            description="Your bookings will appear here once you book or accept a service."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {bookings.map((b) => {
              const s = STATUS_BADGE[b.status];
              return (
                <li key={b.id}>
                  <Card>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{b.service?.title ?? "Service"}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {new Date(b.scheduled_at).toLocaleString("en-LK", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                      <Badge variant={s.variant}>{s.label}</Badge>
                    </div>
                    <p className="mt-3 font-mono font-semibold tabular-nums">
                      {formatLKR(b.total_charged)}
                    </p>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
