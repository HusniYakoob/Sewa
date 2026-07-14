"use client";

import { useActionState } from "react";
import Link from "next/link";
import { changePassword, type ChangePasswordState } from "./actions";
import { Icon } from "@/components/ui/icon";
import { PasswordInput } from "@/components/ui/password-input";

export default function ChangePasswordPage() {
  const [state, action, pending] = useActionState<ChangePasswordState, FormData>(
    changePassword,
    {},
  );

  return (
    <div className="flex min-h-dvh flex-col px-[22px] pt-3">
      <div className="flex items-center gap-3.5">
        <Link
          href="/settings"
          aria-label="Back"
          className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-border bg-surface"
        >
          <Icon name="arrow_back" />
        </Link>
        <p className="text-[16px] font-extrabold">Password &amp; security</p>
      </div>

      <form action={action} className="flex flex-1 flex-col">
        <div className="mt-5.5 flex-1">
          <label className="mb-1.5 block text-[12.5px] font-bold text-muted-foreground">
            Current password
          </label>
          <PasswordInput name="current_password" autoComplete="current-password" required />

          <label className="mb-1.5 mt-4 block text-[12.5px] font-bold text-muted-foreground">
            New password
          </label>
          <PasswordInput
            name="new_password"
            autoComplete="new-password"
            minLength={8}
            required
          />

          <label className="mb-1.5 mt-4 block text-[12.5px] font-bold text-muted-foreground">
            Confirm new password
          </label>
          <PasswordInput name="confirm_password" autoComplete="new-password" required />

          <div className="mt-4 flex items-start gap-2 rounded-xl bg-brand-tint p-3.5">
            <Icon name="info" filled className="mt-0.5 text-base text-brand-text" />
            <span className="text-xs leading-relaxed">
              You&rsquo;ll stay signed in on this device, but other devices will need the new
              password.
            </span>
          </div>

          {state.error ? (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-danger">
              <Icon name="error" className="text-base" />
              {state.error}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mb-[30px] w-full rounded-2xl bg-brand py-4 text-[15.5px] font-extrabold text-white shadow-[0_10px_26px_rgba(131,77,251,.3)] disabled:opacity-60"
        >
          {pending ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
