import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/nav/app-header";
import { BookingForm } from "./booking-form";

export default async function BookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("id, title, price, price_unit, location_area, status")
    .eq("id", id)
    .maybeSingle();

  const s = data as {
    id: string;
    title: string;
    price: number;
    price_unit: string;
    location_area: string | null;
    status: string;
  } | null;

  if (!s || s.status !== "active") notFound();

  return (
    <div>
      <AppHeader title="Book service" backHref={`/service/${id}`} />
      <BookingForm
        serviceId={s.id}
        title={s.title}
        price={Number(s.price)}
        priceUnit={s.price_unit}
        area={s.location_area}
      />
    </div>
  );
}
