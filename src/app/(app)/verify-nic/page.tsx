import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { AppHeader } from "@/components/nav/app-header";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { NicForm } from "./nic-form";
import type { NicStatus } from "@/lib/supabase/types";

export default async function VerifyNicPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("nic_verifications")
    .select("status, rejection_reason")
    .eq("user_id", profile?.id ?? "")
    .maybeSingle();
  const nic = data as { status: NicStatus; rejection_reason: string | null } | null;

  return (
    <div>
      <AppHeader title="NIC verification" backHref="/profile" />

      {nic?.status === "approved" ? (
        <Card className="m-4 flex items-center gap-2 border-success/40">
          <Icon name="verified" filled className="text-success" />
          <p className="text-sm font-medium">Your NIC is verified.</p>
        </Card>
      ) : nic?.status === "pending" ? (
        <Card className="m-4 flex items-center gap-2 border-warning/40">
          <Icon name="hourglass_top" className="text-warning" />
          <p className="text-sm font-medium">
            Verification in progress. We will notify you once reviewed.
          </p>
        </Card>
      ) : (
        <>
          {nic?.status === "rejected" ? (
            <Card className="mx-4 mt-4 flex items-center gap-2 border-danger/40">
              <Icon name="error" className="text-danger" />
              <p className="text-sm">
                Previous submission was rejected
                {nic.rejection_reason ? `: ${nic.rejection_reason}` : ""}. Please
                resubmit.
              </p>
            </Card>
          ) : null}
          <NicForm userId={profile?.id ?? ""} />
        </>
      )}
    </div>
  );
}
