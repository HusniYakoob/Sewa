"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";

/**
 * UI-only permission prompt — no push infrastructure is wired up yet, so
 * "Allow" and "Not now" both just continue into the app.
 */
export default function NotificationsPermissionPage() {
  const router = useRouter();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-[26px] bg-brand-tint">
        <Icon name="notifications_active" filled className="text-[38px] text-brand-text" />
      </span>

      <h1 className="mt-6 text-[22px] font-extrabold tracking-tight">Stay in the loop</h1>
      <p className="mt-2 max-w-xs text-[13.5px] leading-relaxed text-muted-foreground">
        Turn on notifications so you never miss a booking update or a new message.
      </p>

      <div className="mt-8 flex w-full max-w-xs flex-col gap-2.5">
        <button
          type="button"
          onClick={() => router.replace("/home")}
          className="flex w-full items-center justify-center rounded-2xl bg-brand py-4 text-[15px] font-extrabold text-white shadow-[0_10px_26px_rgba(131,77,251,.3)]"
        >
          Allow notifications
        </button>
        <button
          type="button"
          onClick={() => router.replace("/home")}
          className="flex w-full items-center justify-center rounded-2xl py-4 text-[13.5px] font-bold text-muted-foreground"
        >
          Not now
        </button>
      </div>
    </main>
  );
}
