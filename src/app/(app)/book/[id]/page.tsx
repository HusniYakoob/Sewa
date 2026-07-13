import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookingForm } from "./booking-form";

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ package?: string }>;
}) {
  const { id } = await params;
  const { package: packageId } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("id, title, location_area, status")
    .eq("id", id)
    .maybeSingle();

  if (!data || data.status !== "active") notFound();

  let pkg: { id: string; name: string; price: number; price_unit: string } | null = null;
  if (packageId) {
    const { data: p } = await supabase
      .from("service_packages")
      .select("id, name, price, price_unit")
      .eq("id", packageId)
      .eq("service_id", id)
      .maybeSingle();
    pkg = p;
  }

  return (
    <BookingForm
      serviceId={data.id}
      title={data.title}
      area={data.location_area}
      packageId={pkg?.id ?? null}
      packageName={pkg?.name ?? null}
      price={Number(pkg?.price ?? 0)}
    />
  );
}
