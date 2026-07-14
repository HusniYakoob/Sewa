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
    .select(
      "id, title, location_area, status, seller:seller_profiles(rating, total_reviews, nic_verified, profile:profiles(full_name))",
    )
    .eq("id", id)
    .maybeSingle();

  if (!data || data.status !== "active") notFound();
  const seller = data.seller as unknown as {
    rating: number;
    total_reviews: number;
    nic_verified: boolean;
    profile: { full_name: string } | null;
  } | null;

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
      sellerName={seller?.profile?.full_name ?? "Sewa pro"}
      sellerVerified={seller?.nic_verified ?? false}
      sellerRating={seller?.rating ?? 0}
      sellerReviews={seller?.total_reviews ?? 0}
    />
  );
}
