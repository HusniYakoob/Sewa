import { getCurrentSellerProfile } from "@/lib/auth";
import { AppHeader } from "@/components/nav/app-header";
import { BankForm } from "./bank-form";

export default async function BankDetailsPage() {
  const seller = await getCurrentSellerProfile();
  return (
    <div>
      <AppHeader title="Bank details" backHref="/earnings" />
      <BankForm
        defaults={{
          name: seller?.bank_account_name ?? "",
          number: seller?.bank_account_number ?? "",
          bank: seller?.bank_name ?? "",
          branch: seller?.bank_branch ?? "",
        }}
      />
    </div>
  );
}
