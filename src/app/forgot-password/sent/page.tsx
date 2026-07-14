import Link from "next/link";
import { Icon } from "@/components/ui/icon";

export default async function ResetLinkSentPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <div className="flex min-h-dvh flex-col px-[22px] pt-3">
      <Link
        href="/forgot-password"
        aria-label="Back"
        className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-border bg-surface"
      >
        <Icon name="arrow_back" />
      </Link>

      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <span className="flex h-[88px] w-[88px] items-center justify-center rounded-[26px] bg-success/10">
          <Icon name="mark_email_read" filled className="text-[44px] text-success" />
        </span>
        <h1 className="mt-5.5 text-[23px] font-extrabold tracking-tight">Check your email</h1>
        <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-muted-foreground">
          We sent a password reset link to{" "}
          <b className="text-foreground">{email || "your email"}</b>. It expires in 30 minutes.
        </p>
        <Link
          href="/login"
          className="mt-6.5 rounded-2xl bg-brand px-6.5 py-[15px] text-[14.5px] font-extrabold text-white shadow-[0_10px_26px_rgba(131,77,251,.25)]"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
