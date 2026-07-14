import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
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
    <div className="pb-24">
      <div className="flex items-center gap-3.5 px-[22px] pt-3">
        <Link
          href="/account"
          aria-label="Back"
          className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-border bg-surface"
        >
          <Icon name="arrow_back" />
        </Link>
        <p className="text-[16px] font-extrabold">Identity</p>
      </div>

      {nic?.status === "approved" ? (
        <div className="mx-[22px] mt-5 flex items-center gap-3 rounded-2xl border-[1.5px] border-success/30 bg-success/5 p-4">
          <Icon name="verified_user" filled className="text-2xl text-success" />
          <p className="text-sm font-bold">Your NIC is verified.</p>
        </div>
      ) : nic?.status === "pending" ? (
        <div className="mx-[22px] mt-5 flex items-center gap-3 rounded-2xl border-[1.5px] border-warning/30 bg-warning/5 p-4">
          <Icon name="hourglass_top" className="text-2xl text-warning" />
          <p className="text-sm font-bold">
            Verification in progress. We&rsquo;ll notify you once it&rsquo;s reviewed.
          </p>
        </div>
      ) : (
        <>
          {nic?.status === "rejected" ? (
            <div className="mx-[22px] mt-5 px-1">
              <span className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-danger/10">
                <Icon name="gpp_bad" filled className="text-[32px] text-danger" />
              </span>
              <h1 className="mt-4.5 text-[22px] font-extrabold tracking-tight">
                We couldn&rsquo;t verify your NIC
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {nic.rejection_reason || "One or more documents didn't pass review."} Please fix
                and resubmit below.
              </p>
              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Icon name="support_agent" className="text-base" />
                Think this is a mistake?{" "}
                <Link href="/help" className="font-bold text-brand-text">
                  Contact support
                </Link>
              </p>
            </div>
          ) : null}
          <NicForm userId={profile?.id ?? ""} />
        </>
      )}
    </div>
  );
}
