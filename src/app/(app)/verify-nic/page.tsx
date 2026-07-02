import { AppHeader } from "@/components/nav/app-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function VerifyNicPage() {
  return (
    <div>
      <AppHeader title="NIC verification" backHref="/profile" />
      <EmptyState
        icon="badge"
        title="Verification coming soon"
        description="You will upload your NIC and a selfie here. An admin reviews it before you can receive payouts."
      />
    </div>
  );
}
