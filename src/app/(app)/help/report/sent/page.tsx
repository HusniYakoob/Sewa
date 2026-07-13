import Link from "next/link";
import { Icon } from "@/components/ui/icon";

export default function ReportSentPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-[22px] text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
        <Icon name="check_circle" filled className="text-3xl text-success" />
      </span>
      <h1 className="mt-4 text-[20px] font-extrabold tracking-tight">Report sent</h1>
      <p className="mt-2 max-w-xs text-[13.5px] leading-relaxed text-muted-foreground">
        Thanks for letting us know. Our team will review this and follow up by email if needed.
      </p>
      <Link
        href="/help"
        className="mt-6 flex w-full max-w-xs items-center justify-center rounded-2xl bg-brand py-4 text-[15px] font-extrabold text-white"
      >
        Back to Help
      </Link>
    </div>
  );
}
