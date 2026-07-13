import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RescheduleForm } from "./reschedule-form";

export default async function ReschedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select("id, status, scheduled_at, service:services(title)")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  if (data.status !== "accepted") redirect(`/booking/${id}`);

  return (
    <RescheduleForm
      bookingId={id}
      title={(data.service as unknown as { title: string } | null)?.title ?? "Service"}
      originalTime={data.scheduled_at}
    />
  );
}
