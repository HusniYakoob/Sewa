import { redirect } from "next/navigation";
import { getCurrentProfile, getCurrentSellerProfile } from "@/lib/auth";
import { AppHeader } from "@/components/nav/app-header";
import { SellerDetailsForm } from "./seller-details-form";

export default async function SellerProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const seller = await getCurrentSellerProfile();
  if (!seller) redirect("/account");

  return (
    <div>
      <AppHeader title="Seller profile" backHref="/account" />
      <div className="p-4">
        <p className="mb-5 text-sm text-muted-foreground">
          This is what buyers see on your listings — a short bio, what you
          offer, and the areas you cover.
        </p>
        <SellerDetailsForm
          description={seller?.description ?? ""}
          serviceAreas={seller?.service_areas ?? []}
        />
      </div>
    </div>
  );
}
